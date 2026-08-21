// =========================================================
// NetSvr
// Room Manager
// =========================================================

const Room = {

    /* -----------------------------------------------------
       Configuration
    ----------------------------------------------------- */

    STORAGE_KEY: "netsvr_room",

    ROOM_LENGTH: 5,

    EXPIRATION_HOURS: 24,

    expirationTimer: null,


    /* -----------------------------------------------------
       Create Room
    ----------------------------------------------------- */

    create() {

        const roomCode =
            this.generateRoomCode();


        const room = {

            code: roomCode,

            createdAt:
                Date.now(),

            expiresAt:
                Date.now() +
                (
                    this.EXPIRATION_HOURS *
                    60 *
                    60 *
                    1000
                ),

            text: "",

            files: []

        };


        this.save(room);


        this.startExpirationTimer(
            room.expiresAt
        );


        if (
            typeof UI !== "undefined"
        ) {

            UI.showRoom(
                roomCode
            );

            UI.showToast(
                "Room created!"
            );

        }

    },


    /* -----------------------------------------------------
       Join Room
    ----------------------------------------------------- */

    join(code) {

        const roomCode =
            code.trim().toUpperCase();


        if (
            !this.isValidRoomCode(
                roomCode
            )
        ) {

            if (
                typeof UI !== "undefined"
            ) {

                UI.showRoomError(
                    "Invalid room code."
                );

            }

            return;

        }


        /*
         * Temporary local implementation.
         *
         * Later this will call the
         * NetSvr backend/API.
         */

        const existingRoom =
            this.getSavedRoom();


        if (
            existingRoom &&
            existingRoom.code === roomCode
        ) {

            if (
                this.isExpired(
                    existingRoom
                )
            ) {

                this.clear();

                if (
                    typeof UI !== "undefined"
                ) {

                    UI.showRoomError(
                        "This room has expired."
                    );

                }

                return;

            }


            this.startExpirationTimer(
                existingRoom.expiresAt
            );

        } else {

            /*
             * Simulated remote room.
             *
             * This lets us test the UI before
             * connecting the real backend.
             */

            const room = {

                code: roomCode,

                createdAt:
                    Date.now(),

                expiresAt:
                    Date.now() +
                    (
                        this.EXPIRATION_HOURS *
                        60 *
                        60 *
                        1000
                    ),

                text: "",

                files: []

            };


            this.save(room);


            this.startExpirationTimer(
                room.expiresAt
            );

        }


        if (
            typeof UI !== "undefined"
        ) {

            UI.showRoom(
                roomCode
            );

            UI.showToast(
                `Joined room ${roomCode}`
            );

        }

    },


    /* -----------------------------------------------------
       Generate Room Code
    ----------------------------------------------------- */

    generateRoomCode() {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


        let code = "";


        for (
            let i = 0;
            i < this.ROOM_LENGTH;
            i++
        ) {

            const index =
                Math.floor(
                    Math.random() *
                    characters.length
                );


            code +=
                characters[index];

        }


        return code;

    },


    /* -----------------------------------------------------
       Validate Room Code
    ----------------------------------------------------- */

    isValidRoomCode(code) {

        const pattern =
            /^[A-Z0-9]{4,8}$/;


        return pattern.test(
            code
        );

    },


    /* -----------------------------------------------------
       Save Room
    ----------------------------------------------------- */

    save(room) {

        try {

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(room)
            );

        } catch (error) {

            console.error(
                "Unable to save room:",
                error
            );

        }

    },


    /* -----------------------------------------------------
       Get Saved Room
    ----------------------------------------------------- */

    getSavedRoom() {

        try {

            const data =
                localStorage.getItem(
                    this.STORAGE_KEY
                );


            if (!data) {

                return null;

            }


            return JSON.parse(
                data
            );

        } catch (error) {

            console.error(
                "Unable to read room:",
                error
            );

            return null;

        }

    },


    /* -----------------------------------------------------
       Clear Room
    ----------------------------------------------------- */

    clear() {

        localStorage.removeItem(
            this.STORAGE_KEY
        );


        this.stopExpirationTimer();

    },


    /* -----------------------------------------------------
       Leave Room
    ----------------------------------------------------- */

    leave() {

        this.clear();

    },


    /* -----------------------------------------------------
       Check Expiration
    ----------------------------------------------------- */

    isExpired(room) {

        if (!room) {

            return true;

        }


        return (
            Date.now() >=
            room.expiresAt
        );

    },


    /* -----------------------------------------------------
       Start Expiration Timer
    ----------------------------------------------------- */

    startExpirationTimer(
        expiresAt
    ) {

        this.stopExpirationTimer();


        this.updateExpiration(
            expiresAt
        );


        this.expirationTimer =
            setInterval(
                () => {

                    this.updateExpiration(
                        expiresAt
                    );

                },
                1000
            );

    },


    /* -----------------------------------------------------
       Update Expiration
    ----------------------------------------------------- */

    updateExpiration(
        expiresAt
    ) {

        const element =
            document.getElementById(
                "expirationTime"
            );


        if (!element) {

            return;

        }


        const remaining =
            expiresAt -
            Date.now();


        if (remaining <= 0) {

            element.textContent =
                "Expired";


            this.handleExpiration();

            return;

        }


        const totalSeconds =
            Math.floor(
                remaining / 1000
            );


        const hours =
            Math.floor(
                totalSeconds / 3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        const seconds =
            totalSeconds % 60;


        element.textContent =
            `${this.pad(hours)}:` +
            `${this.pad(minutes)}:` +
            `${this.pad(seconds)}`;

    },


    /* -----------------------------------------------------
       Handle Expiration
    ----------------------------------------------------- */

    handleExpiration() {

        this.stopExpirationTimer();


        this.clear();


        if (
            typeof UI !== "undefined"
        ) {

            UI.showToast(
                "This room has expired."
            );

        }


        setTimeout(
            () => {

                if (
                    typeof UI !== "undefined"
                ) {

                    UI.elements.roomSection?.classList.add(
                        "hidden"
                    );

                    UI.elements.landingSection?.classList.remove(
                        "hidden"
                    );

                    UI.setConnectionStatus(
                        "Ready"
                    );

                }

            },
            1200
        );

    },


    /* -----------------------------------------------------
       Stop Expiration Timer
    ----------------------------------------------------- */

    stopExpirationTimer() {

        if (
            this.expirationTimer
        ) {

            clearInterval(
                this.expirationTimer
            );

            this.expirationTimer =
                null;

        }

    },


    /* -----------------------------------------------------
       Padding Helper
    ----------------------------------------------------- */

    pad(number) {

        return String(
            number
        ).padStart(
            2,
            "0"
        );

    }

};