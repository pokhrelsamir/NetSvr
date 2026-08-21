// =========================================================
// NetSvr
// API Server
// =========================================================
const http = require("http");

const {
    createWebSocketServer
} = require("./websocket");


const express = require("express");

const {
    createRoom,
    getRoom,
    roomExists,
    updateText,
    deleteRoom,
    getStats
} = require("./rooms");

const app = express();


// ---------------------------------------------------------
// Configuration
// ---------------------------------------------------------

const PORT =
    process.env.PORT || 3000;


// ---------------------------------------------------------
// Middleware
// ---------------------------------------------------------

app.use(
    express.json({
        limit: "1mb"
    })
);


// ---------------------------------------------------------
// CORS
// ---------------------------------------------------------

app.use(
    (req, res, next) => {

        res.header(
            "Access-Control-Allow-Origin",
            "*"
        );

        res.header(
            "Access-Control-Allow-Methods",
            "GET,POST,PATCH,DELETE,OPTIONS"
        );

        res.header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        );


        if (
            req.method === "OPTIONS"
        ) {

            return res.sendStatus(204);

        }


        next();

    }
);


// ---------------------------------------------------------
// Health Check
// ---------------------------------------------------------

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            status: "ok",

            service: "NetSvr",

            timestamp:
                new Date().toISOString()

        });

    }
);


// ---------------------------------------------------------
// Create Room
// ---------------------------------------------------------

app.post(
    "/api/rooms",
    (req, res) => {

        try {

            const room =
                createRoom();


            res.status(201).json({

                success: true,

                room

            });

        } catch (error) {

            console.error(
                "Create room error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Unable to create room."

            });

        }

    }
);


// ---------------------------------------------------------
// Get Room
// ---------------------------------------------------------

app.get(
    "/api/rooms/:code",
    (req, res) => {

        const code =
            req.params.code
                .trim()
                .toUpperCase();


        const room =
            getRoom(code);


        if (!room) {

            return res.status(404).json({

                success: false,

                error:
                    "Room not found or expired."

            });

        }


        res.json({

            success: true,

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
                    room.clients.size

            }

        });

    }
);


// ---------------------------------------------------------
// Update Shared Text
// ---------------------------------------------------------

app.patch(
    "/api/rooms/:code",
    (req, res) => {

        const code =
            req.params.code
                .trim()
                .toUpperCase();


        if (!roomExists(code)) {

            return res.status(404).json({

                success: false,

                error:
                    "Room not found."

            });

        }


        if (
            typeof req.body.text !==
            "string"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Text must be a string."

            });

        }


        const room =
            updateText(
                code,
                req.body.text
            );


        res.json({

            success: true,

            room: {

                code:
                    room.code,

                text:
                    room.text

            }

        });

    }
);


// ---------------------------------------------------------
// Delete Room
// ---------------------------------------------------------

app.delete(
    "/api/rooms/:code",
    (req, res) => {

        const code =
            req.params.code
                .trim()
                .toUpperCase();


        const deleted =
            deleteRoom(code);


        if (!deleted) {

            return res.status(404).json({

                success: false,

                error:
                    "Room not found."

            });

        }


        res.json({

            success: true,

            message:
                "Room deleted."

        });

    }
);


// ---------------------------------------------------------
// Server Statistics
// ---------------------------------------------------------

app.get(
    "/api/stats",
    (req, res) => {

        res.json({

            success: true,

            stats:
                getStats()

        });

    }
);


// ---------------------------------------------------------
// 404 Handler
// ---------------------------------------------------------

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success: false,

            error:
                "API endpoint not found."

        });

    }
);


// ---------------------------------------------------------
// Error Handler
// ---------------------------------------------------------

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


// ---------------------------------------------------------
// Start Server
// ---------------------------------------------------------

if (
    require.main === module
) {

    const server =
    http.createServer(app);

createWebSocketServer(
    server
);


if (
    require.main === module
) {

    server.listen(
        PORT,
        () => {

            console.log(
                `NetSvr server running on port ${PORT}`
            );

            console.log(
                `WebSocket endpoint: ws://localhost:${PORT}/ws`
            );

        }
    );

}


module.exports = server;

}


// ---------------------------------------------------------
// Export
// ---------------------------------------------------------

module.exports = app;