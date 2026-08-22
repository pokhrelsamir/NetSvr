// =========================================================
// NetSvr
// /api/rooms/:code — Check, Update, Delete Room
// =========================================================

const {
    getRoom,
    updateText,
    deleteRoom,
    applyCors,
    sendJSON,
    readJsonBody
} = require("../_lib/store");


const CODE_PATTERN =
    /^[A-Z0-9]{3,10}$/;


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


    const code = String(
        req.query.code || ""
    )
        .trim()
        .toUpperCase();


    if (
        !CODE_PATTERN.test(code)
    ) {

        sendJSON(
            res,
            400,
            {
                success: false,
                error:
                    "Invalid room code."
            }
        );

        return;

    }


    try {

        // -------------------------------------------------
        // GET — Check Room
        // -------------------------------------------------

        if (
            req.method === "GET"
        ) {

            const room =
                await getRoom(code);


            if (!room) {

                sendJSON(
                    res,
                    404,
                    {
                        success: false,
                        error:
                            "Room not found or expired."
                    }
                );

                return;

            }


            sendJSON(
                res,
                200,
                {
                    success: true,
                    room
                }
            );

            return;

        }


        // -------------------------------------------------
        // PATCH — Update Shared Text
        // -------------------------------------------------

        if (
            req.method === "PATCH"
        ) {

            let body;


            try {

                body =
                    await readJsonBody(
                        req
                    );

            } catch (error) {

                sendJSON(
                    res,
                    400,
                    {
                        success: false,
                        error:
                            error.message ||
                                "Invalid request body."
                    }
                );

                return;

            }


            if (
                typeof body.text !== "string"
            ) {

                sendJSON(
                    res,
                    400,
                    {
                        success: false,
                        error:
                            "Text must be a string."
                    }
                );

                return;

            }


            const room =
                await updateText(
                    code,
                    body.text
                );


            if (!room) {

                sendJSON(
                    res,
                    404,
                    {
                        success: false,
                        error:
                            "Room not found or expired."
                    }
                );

                return;

            }


            sendJSON(
                res,
                200,
                {
                    success: true,
                    room
                }
            );

            return;

        }


        // -------------------------------------------------
        // DELETE — Remove Room
        // -------------------------------------------------

        if (
            req.method === "DELETE"
        ) {

            const deleted =
                await deleteRoom(code);


            if (!deleted) {

                sendJSON(
                    res,
                    404,
                    {
                        success: false,
                        error:
                            "Room not found."
                    }
                );

                return;

            }


            sendJSON(
                res,
                200,
                {
                    success: true,
                    message:
                        "Room deleted."
                }
            );

            return;

        }


        sendJSON(
            res,
            405,
            {
                success: false,
                error:
                    "Method not allowed. Use GET, PATCH or DELETE."
            }
        );

    } catch (error) {

        console.error(
            `Room ${code} ${req.method} error:`,
            error
        );


        sendJSON(
            res,
            500,
            {
                success: false,
                error:
                    "Internal server error."
            }
        );

    }

};
