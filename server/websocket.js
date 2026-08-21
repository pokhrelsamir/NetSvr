// =========================================================
// NetSvr
// WebSocket Manager
// =========================================================

const WebSocket = require("ws");

const {
    getRoom,
    addClient,
    removeClient,
    getClientCount
} = require("./rooms");


// ---------------------------------------------------------
// Create WebSocket Server
// ---------------------------------------------------------

function createWebSocketServer(server) {

    const wss =
        new WebSocket.Server({
            server,
            path: "/ws"
        });


    console.log(
        "NetSvr WebSocket server initialized."
    );


    // -----------------------------------------------------
    // New Connection
    // -----------------------------------------------------

    wss.on(
        "connection",
        (socket, request) => {

            console.log(
                "WebSocket client connected."
            );


            let currentRoom = null;


            // -------------------------------------------------
            // Message Handler
            // -------------------------------------------------

            socket.on(
                "message",
                (rawMessage) => {

                    handleMessage(
                        socket,
                        rawMessage,
                        () => currentRoom,
                        (roomCode) => {

                            currentRoom =
                                roomCode;

                        }
                    );

                }
            );


            // -------------------------------------------------
            // Disconnect
            // -------------------------------------------------

            socket.on(
                "close",
                () => {

                    if (currentRoom) {

                        removeClient(
                            currentRoom,
                            socket
                        );


                        broadcast(
                            currentRoom,
                            {
                                type:
                                    "USER_COUNT",

                                count:
                                    getClientCount(
                                        currentRoom
                                    )
                            },
                            socket
                        );

                    }


                    console.log(
                        "WebSocket client disconnected."
                    );

                }
            );


            // -------------------------------------------------
            // Error
            // -------------------------------------------------

            socket.on(
                "error",
                (error) => {

                    console.error(
                        "WebSocket error:",
                        error
                    );

                }
            );

        }
    );


    return wss;

}


// ---------------------------------------------------------
// Handle Messages
// ---------------------------------------------------------

function handleMessage(
    socket,
    rawMessage,
    getCurrentRoom,
    setCurrentRoom
) {

    let message;


    // -----------------------------------------------------
    // Parse Message
    // -----------------------------------------------------

    try {

        message =
            JSON.parse(
                rawMessage.toString()
            );

    } catch (error) {

        send(
            socket,
            {
                type: "ERROR",

                message:
                    "Invalid message format."
            }
        );

        return;

    }


    if (
        !message.type
    ) {

        send(
            socket,
            {
                type: "ERROR",

                message:
                    "Message type is required."
            }
        );

        return;

    }


    // -----------------------------------------------------
    // ROOM_JOIN
    // -----------------------------------------------------

    if (
        message.type ===
        "ROOM_JOIN"
    ) {

        joinRoom(
            socket,
            message,
            setCurrentRoom
        );

        return;

    }


    // -----------------------------------------------------
    // ROOM_LEAVE
    // -----------------------------------------------------

    if (
        message.type ===
        "ROOM_LEAVE"
    ) {

        leaveRoom(
            socket,
            getCurrentRoom,
            setCurrentRoom
        );

        return;

    }


    // -----------------------------------------------------
    // TEXT_UPDATE
    // -----------------------------------------------------

    if (
        message.type ===
        "TEXT_UPDATE"
    ) {

        updateText(
            socket,
            message,
            getCurrentRoom
        );

        return;

    }


    // -----------------------------------------------------
    // PING
    // -----------------------------------------------------

    if (
        message.type ===
        "PING"
    ) {

        send(
            socket,
            {
                type: "PONG",

                timestamp:
                    Date.now()
            }
        );

        return;

    }


    // -----------------------------------------------------
    // Unknown Message
    // -----------------------------------------------------

    send(
        socket,
        {
            type: "ERROR",

            message:
                "Unknown message type."
        }
    );

}


// ---------------------------------------------------------
// Join Room
// ---------------------------------------------------------

function joinRoom(
    socket,
    message,
    setCurrentRoom
) {

    const roomCode =
        String(
            message.roomCode || ""
        )
            .trim()
            .toUpperCase();


    if (!roomCode) {

        send(
            socket,
            {
                type: "ERROR",

                message:
                    "Room code is required."
            }
        );

        return;

    }


    const room =
        getRoom(
            roomCode
        );


    if (!room) {

        send(
            socket,
            {
                type: "ROOM_ERROR",

                message:
                    "Room not found or expired."
            }
        );

        return;

    }


    // -----------------------------------------------------
    // Register Client
    // -----------------------------------------------------

    addClient(
        roomCode,
        socket
    );


    setCurrentRoom(
        roomCode
    );


    // -----------------------------------------------------
    // Send Current Room State
    // -----------------------------------------------------

    send(
        socket,
        {
            type:
                "ROOM_JOINED",

            room: {

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
                    getClientCount(
                        roomCode
                    )

            }

        }
    );


    // -----------------------------------------------------
    // Notify Other Clients
    // -----------------------------------------------------

    broadcast(
        roomCode,
        {
            type:
                "USER_COUNT",

            count:
                getClientCount(
                    roomCode
                )
        },
        socket
    );


    console.log(
        `Client joined room ${roomCode}`
    );

}


// ---------------------------------------------------------
// Leave Room
// ---------------------------------------------------------

function leaveRoom(
    socket,
    getCurrentRoom,
    setCurrentRoom
) {

    const roomCode =
        getCurrentRoom();


    if (!roomCode) {

        return;

    }


    removeClient(
        roomCode,
        socket
    );


    broadcast(
        roomCode,
        {
            type:
                "USER_COUNT",

            count:
                getClientCount(
                    roomCode
                )
        }
    );


    setCurrentRoom(
        null
    );


    send(
        socket,
        {
            type:
                "ROOM_LEFT"
        }
    );

}


// ---------------------------------------------------------
// Update Text
// ---------------------------------------------------------

function updateText(
    socket,
    message,
    getCurrentRoom
) {

    const roomCode =
        getCurrentRoom();


    if (!roomCode) {

        send(
            socket,
            {
                type: "ERROR",

                message:
                    "Join a room first."
            }
        );

        return;

    }


    const room =
        getRoom(
            roomCode
        );


    if (!room) {

        send(
            socket,
            {
                type:
                    "ROOM_ERROR",

                message:
                    "Room expired."
            }
        );

        return;

    }


    const text =
        typeof message.text === "string"
            ? message.text
            : "";


    room.text =
        text;


    // -----------------------------------------------------
    // Broadcast to everyone else
    // -----------------------------------------------------

    broadcast(
        roomCode,
        {
            type:
                "TEXT_UPDATE",

            text

        },
        socket
    );


    // -----------------------------------------------------
    // Acknowledge sender
    // -----------------------------------------------------

    send(
        socket,
        {
            type:
                "TEXT_SAVED"
        }
    );

}


// ---------------------------------------------------------
// Send Message
// ---------------------------------------------------------

function send(
    socket,
    data
) {

    if (
        socket.readyState !==
        WebSocket.OPEN
    ) {

        return;

    }


    socket.send(
        JSON.stringify(
            data
        )
    );

}


// ---------------------------------------------------------
// Broadcast Message
// ---------------------------------------------------------

function broadcast(
    roomCode,
    data,
    excludedSocket = null
) {

    const room =
        getRoom(
            roomCode
        );


    if (!room) {

        return;

    }


    for (
        const client of room.clients
    ) {

        if (
            client === excludedSocket
        ) {

            continue;

        }


        send(
            client,
            data
        );

    }

}


// ---------------------------------------------------------
// Export
// ---------------------------------------------------------

module.exports = {

    createWebSocketServer

};