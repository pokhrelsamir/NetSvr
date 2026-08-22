// =========================================================
// NetSvr
// Serverless Room Store + HTTP Helpers
//
// Storage strategy:
//   - In-memory Map cached on `globalThis`, so data
//     survives across warm invocations of the same
//     lambda instance.
//   - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//     are configured, rooms are persisted to Upstash Redis
//     so they survive cold starts and are shared between
//     instances.
// =========================================================

const crypto = require("crypto");

const ROOM_LENGTH = 5;

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

const CODE_CHARACTERS =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/*
 * Server-side cap for a single shared file.
 * Base64 inflates payloads by ~33%, so this
 * keeps requests under Vercel's body limit.
 */

const MAX_FILE_SIZE = 3_000_000;

const MAX_FILE_NAME = 200;

/*
 * Warm-instance memory cache.
 */

const globalCache = globalThis;

if (!globalCache.__NETSVR_ROOMS__) {

    globalCache.__NETSVR_ROOMS__ = new Map();

}

const memoryRooms =
    globalCache.__NETSVR_ROOMS__;


// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function isRedisConfigured() {

    return Boolean(
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
    );

}


async function redisCommand(...parts) {

    const url =
        `${process.env.UPSTASH_REDIS_REST_URL}/${parts.map(encodeURIComponent).join("/")}`;


    const response =
        await fetch(
            url,
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
                }
            }
        );


    if (!response.ok) {

        throw new Error(
            `Upstash ${parts[0]} failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    return data.result;

}


function redisKey(code) {

    return `netsvr:room:${String(code).toUpperCase()}`;

}


/*
 * POST-body command form. Unlike the URL-path
 * form, this supports arbitrarily large values
 * (needed when a room holds base64 file data).
 */

async function redisWrite(...command) {

    const response =
        await fetch(
            process.env.UPSTASH_REDIS_REST_URL,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
                },

                body:
                    JSON.stringify(command)
            }
        );


    if (!response.ok) {

        throw new Error(
            `Upstash ${command[0]} failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    return data.result;

}


function generateRoomCode() {

    let code = "";


    for (
        let i = 0;
        i < ROOM_LENGTH;
        i++
    ) {

        const index =
            crypto.randomInt(
                0,
                CODE_CHARACTERS.length
            );


        code += CODE_CHARACTERS[index];

    }


    return code;

}


function sanitizeRoom(room) {

    return {
        code: room.code,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        text: room.text,
        files: room.files || [],
        clients: 0
    };

}


function isExpired(room) {

    return Date.now() >= room.expiresAt;

}


function normalizeCode(code) {

    return String(code || "")
        .trim()
        .toUpperCase();

}


// ---------------------------------------------------------
// Room Operations
// ---------------------------------------------------------

function newRoom(code) {

    const now =
        Date.now();


    return {
        code,
        createdAt: now,
        expiresAt: now + ROOM_TTL_MS,
        text: "",
        files: []
    };

}


function parseStoredRoom(raw) {

    try {

        const parsed =
            typeof raw === "string"
                ? JSON.parse(raw)
                : raw;


        if (
            !parsed ||
            !parsed.code ||
            !parsed.expiresAt
        ) {

            return null;

        }


        return parsed;

    } catch (error) {

        return null;

    }

}


async function createRoom() {

    let code;


    do {

        code =
            generateRoomCode();

    } while (
        await getRoom(code)
    );


    const room =
        newRoom(code);


    memoryRooms.set(
        code,
        room
    );


    if (isRedisConfigured()) {

        await redisCommand(
            "set",
            redisKey(code),
            JSON.stringify(room),
            "px",
            String(ROOM_TTL_MS)
        );

    }


    return sanitizeRoom(room);

}


async function getRoom(code) {

    const normalized =
        normalizeCode(code);


    if (!normalized) {

        return null;

    }


    let room =
        memoryRooms.get(normalized) ||
        null;


    if (
        !room &&
        isRedisConfigured()
    ) {

        const raw =
            await redisCommand(
                "get",
                redisKey(normalized)
            );


        room =
            parseStoredRoom(raw);


        if (room) {

            memoryRooms.set(
                normalized,
                room
            );

        }

    }


    if (!room) {

        return null;

    }


    if (isExpired(room)) {

        memoryRooms.delete(normalized);


        if (isRedisConfigured()) {

            try {

                await redisCommand(
                    "del",
                    redisKey(normalized)
                );

            } catch (error) {

                console.error(
                    "Upstash del failed:",
                    error
                );

            }

        }


        return null;

    }


    return room;

}


async function updateText(code, text) {

    const room =
        await getRoom(code);


    if (!room) {

        return null;

    }


    room.text =
        typeof text === "string" ? text : "";


    memoryRooms.set(
        room.code,
        room
    );


    if (isRedisConfigured()) {

        const remainingMs =
            Math.max(
                room.expiresAt - Date.now(),
                60000
            );


        await redisCommand(
            "set",
            redisKey(room.code),
            JSON.stringify(room),
            "px",
            String(remainingMs)
        );

    }


    return sanitizeRoom(room);

}


async function deleteRoom(code) {

    const normalized =
        normalizeCode(code);


    const existed =
        memoryRooms.delete(normalized);


    if (isRedisConfigured()) {

        try {

            await redisCommand(
                "del",
                redisKey(normalized)
            );

        } catch (error) {

            console.error(
                "Upstash del failed:",
                error
            );

        }

    }


    return existed;

}


// ---------------------------------------------------------
// HTTP Helpers
// ---------------------------------------------------------

function applyCors(req, res) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,DELETE,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

}


function sendJSON(res, status, payload) {

    res.statusCode =
        status;

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    res.end(
        JSON.stringify(payload)
    );

}


function readJsonBody(req) {

    return new Promise(
        (resolve, reject) => {

            let raw = "";

            let overflow = false;


            req.on(
                "data",
                (chunk) => {

                    raw += chunk;


                    if (raw.length > 1_000_000) {

                        overflow = true;

                        req.destroy();

                        reject(
                            new Error("Payload too large.")
                        );

                    }

                }
            );


            req.on(
                "end",
                () => {

                    if (overflow) {

                        return;

                    }


                    if (!raw) {

                        resolve({});

                        return;

                    }


                    try {

                        resolve(
                            JSON.parse(raw)
                        );

                    } catch (error) {

                        reject(
                            new Error("Invalid JSON body.")
                        );

                    }

                }
            );


            req.on(
                "error",
                reject
            );

        }
    );

}


module.exports = {
    createRoom,
    getRoom,
    updateText,
    deleteRoom,
    applyCors,
    sendJSON,
    readJsonBody
};
