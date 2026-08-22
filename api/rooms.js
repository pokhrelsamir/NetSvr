// =========================================================
// NetSvr
// POST /api/rooms — Create Room
// =========================================================

const {
    createRoom,
    applyCors,
    sendJSON
} = require("./_lib/store");


module.exports = async function handler(req, res) {

    applyCors(
        req,
        res
    );


    if (
        req.method === "OPTIONS"
    ) {

        res.statusCode = 204;

        res.end();

        return;

    }


    if (
        req.method !== "POST"
    ) {

        sendJSON(
            res,
            405,
            {
                success: false,
                error:
                    "Method not allowed. Use POST."
            }
        );

        return;

    }


    try {

        const room =
            await createRoom();


        console.log(
            `Room created: ${room.code}`
        );


        sendJSON(
            res,
            201,
            {
                success: true,
                room
            }
        );

    } catch (error) {

        console.error(
            "Create room error:",
            error
        );


        sendJSON(
            res,
            500,
            {
                success: false,
                error:
                    "Unable to create room."
            }
        );

    }

};
