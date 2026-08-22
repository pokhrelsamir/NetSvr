// =========================================================
// NetSvr
// Application Controller
// =========================================================

const App = {

    /* -----------------------------------------------------
       Initialize Application
    ----------------------------------------------------- */

    init() {

        console.log(
            "NetSvr initializing..."
        );


        this.restoreRoomFromStorage();

        this.handleRoomURL();

        this.setupGlobalHandlers();


        console.log(
            "NetSvr initialized successfully."
        );

    },


    /* -----------------------------------------------------
       Restore Existing Room
    ----------------------------------------------------- */

    restoreRoomFromStorage() {

        if (
            typeof Room === "undefined"
        ) {

            return;

        }


        const room =
            Room.getSavedRoom();


        if (!room) {

            return;

        }


        if (
            Room.isExpired(room)
        ) {

            Room.clear();

            return;

        }


        /*
         * Only restore automatically if the
         * user is still on the main page.
         */

        const path =
            window.location.pathname;


        if (
            path === "/" ||
            path === "/index.html"
        ) {

            if (
                typeof UI !== "undefined"
            ) {

                UI.showRoom(
                    room.code
                );

            }


            Room.startExpirationTimer(
                room.expiresAt,
                () => {

                    if (
                        typeof UI !== "undefined" &&
                        typeof UI.handleRoomExpired ===
                            "function"
                    ) {

                        UI.handleRoomExpired();

                    }

                }
            );


            if (
                typeof Editor !== "undefined" &&
                typeof Editor.connect === "function"
            ) {

                Editor.connect(
                    room.code
                );

            }

        }

    },


    /* -----------------------------------------------------
       Handle Room URL
       ----------------------------------------------------- */

    handleRoomURL() {

        const path =
            window.location.pathname;


        /*
         * Expected URL:
         *
         * /room/ABC42
         */

        const match =
            path.match(
                /^\/room\/([A-Z0-9]{4,8})\/?$/
            );


        if (!match) {

            return;

        }


        const roomCode =
            match[1].toUpperCase();


        /*
         * Wait until UI is ready.
         */

        setTimeout(
            () => {

                if (
                    typeof UI !== "undefined"
                ) {

                    UI.showJoinBox();


                    if (
                        UI.elements.roomCodeInput
                    ) {

                        UI.elements.roomCodeInput.value =
                            roomCode;

                    }

                }

            },
            100
        );

    },


    /* -----------------------------------------------------
       Global Event Handlers
    ----------------------------------------------------- */

    setupGlobalHandlers() {

        window.addEventListener(
            "online",
            () => {

                if (
                    typeof UI !== "undefined"
                ) {

                    UI.setConnectionStatus(
                        "Connected"
                    );


                    UI.showToast(
                        "Internet connection restored."
                    );

                }

            }
        );


        window.addEventListener(
            "offline",
            () => {

                if (
                    typeof UI !== "undefined"
                ) {

                    UI.setConnectionStatus(
                        "Offline"
                    );


                    UI.showToast(
                        "You are offline."
                    );

                }

            }
        );


        window.addEventListener(
            "error",
            (event) => {

                console.error(
                    "NetSvr error:",
                    event.error
                );

            }
        );


        window.addEventListener(
            "unhandledrejection",
            (event) => {

                console.error(
                    "NetSvr promise error:",
                    event.reason
                );

            }
        );

    }

};


/* =========================================================
   Start Application
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        App.init();

    }
);