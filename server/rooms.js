// =========================================================
// NetSvr
// Room Manager
// =========================================================

const crypto = require("crypto");

const rooms = new Map();

const ROOM_LENGTH = 5;
const ROOM_TTL = 24 * 60 * 60 * 1000;


// ---------------------------------------------------------
// Generate Room Code
// ---------------------------------------------------------

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < ROOM_LENGTH; i++) {

        const index =
            crypto.randomInt(
                0,
                characters.length
            );

        code += characters[index];

    }

    return code;
}


// ---------------------------------------------------------
// Create Room
// ---------------------------------------------------------

function createRoom() {

    let code;

    do {

        code =
            generateRoomCode();

    } while (
        rooms.has(code)
    );


    const now =
        Date.now();


    const room = {

        code,

        createdAt: now,

        expiresAt:
            now + ROOM_TTL,

        text: "",

        files: [],

        clients: new Set()

    };


    rooms.set(
        code,
        room
    );


    return sanitizeRoom(room);

}


// ---------------------------------------------------------
// Get Room
// ---------------------------------------------------------

function getRoom(code) {

    if (!code) {

        return null;

    }


    const room =
        rooms.get(
            code.toUpperCase()
        );


    if (!room) {

        return null;

    }


    if (
        isExpired(room)
    ) {

        deleteRoom(
            room.code
        );

        return null;

    }


    return room;

}


// ---------------------------------------------------------
// Check Room
// ---------------------------------------------------------

function roomExists(code) {

    return !!getRoom(code);

}


// ---------------------------------------------------------
// Update Text
// ---------------------------------------------------------

function updateText(
    code,
    text
) {

    const room =
        getRoom(code);


    if (!room) {

        return null;

    }


    room.text =
        typeof text === "string"
            ? text
            : "";


    return room;

}


// ---------------------------------------------------------
// Add Client
// ---------------------------------------------------------

function addClient(
    code,
    client
) {

    const room =
        getRoom(code);


    if (!room) {

        return false;

    }


    room.clients.add(
        client
    );


    return true;

}


// ---------------------------------------------------------
// Remove Client
// ---------------------------------------------------------

function removeClient(
    code,
    client
) {

    const room =
        rooms.get(
            code?.toUpperCase()
        );


    if (!room) {

        return;

    }


    room.clients.delete(
        client
    );

}


// ---------------------------------------------------------
// Get Client Count
// ---------------------------------------------------------

function getClientCount(
    code
) {

    const room =
        getRoom(code);


    if (!room) {

        return 0;

    }


    return room.clients.size;

}


// ---------------------------------------------------------
// Delete Room
// ---------------------------------------------------------

function deleteRoom(code) {

    const normalizedCode =
        code?.toUpperCase();


    const room =
        rooms.get(
            normalizedCode
        );


    if (!room) {

        return false;

    }


    /*
     * Close connected clients.
     */

    for (
        const client of room.clients
    ) {

        try {

            if (
                typeof client.close ===
                "function"
            ) {

                client.close();

            }

        } catch (error) {

            console.error(
                "Client close error:",
                error
            );

        }

    }


    rooms.delete(
        normalizedCode
    );


    return true;

}


// ---------------------------------------------------------
// Expiration
// ---------------------------------------------------------

function isExpired(room) {

    return (
        Date.now() >=
        room.expiresAt
    );

}


// ---------------------------------------------------------
// Remove Expired Rooms
// ---------------------------------------------------------

function cleanupExpiredRooms() {

    for (
        const [code, room]
        of rooms.entries()
    ) {

        if (
            isExpired(room)
        ) {

            deleteRoom(
                code
            );

        }

    }

}


// ---------------------------------------------------------
// Public Room Data
// ---------------------------------------------------------

function sanitizeRoom(room) {

    return {

        code:
            room.code,

        createdAt:
            room.createdAt,

        expiresAt:
            room.expiresAt,

        text:
            room.text,

        files:
            room.files,

        clients:
            room.clients.size

    };

}


// ---------------------------------------------------------
// Room Statistics
// ---------------------------------------------------------

function getStats() {

    return {

        rooms:
            rooms.size,

        activeConnections:
            [...rooms.values()]
                .reduce(
                    (
                        total,
                        room
                    ) =>
                        total +
                        room.clients.size,
                    0
                )

    };

}


// ---------------------------------------------------------
// Cleanup Every Minute
// ---------------------------------------------------------

setInterval(
    cleanupExpiredRooms,
    60 * 1000
);


// ---------------------------------------------------------
// Exports
// ---------------------------------------------------------

module.exports = {

    createRoom,

    getRoom,

    roomExists,

    updateText,

    addClient,

    removeClient,

    getClientCount,

    deleteRoom,

    cleanupExpiredRooms,

    getStats

};