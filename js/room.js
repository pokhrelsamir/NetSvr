// =========================================================
// NetSvr
// Room Manager
// =========================================================

const Room = {

    STORAGE_KEY: "netsvr_room",

    API_BASE: "/api/rooms",


    // =====================================================
    // Create Room
    // =====================================================

    async create() {

        try {

            const response =
                await fetch(
                    this.API_BASE,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.error ||
                    "Unable to create room."
                );

            }


            const room =
                data.room;


            this.saveRoom(
                room
            );


            return room;

        } catch (error) {

            console.error(
                "Create room error:",
                error
            );


            throw error;

        }

    },


    // =====================================================
    // Check Room
    // =====================================================

    async check(code) {

        const roomCode =
            String(code || "")
                .trim()
                .toUpperCase();


        if (!roomCode) {

            return null;

        }


        try {

            const response =
                await fetch(
                    `${this.API_BASE}/${roomCode}`
                );


            if (
                !response.ok
            ) {

                return null;

            }


            const data =
                await response.json();


            if (
                !data.success
            ) {

                return null;

            }


            return data.room;

        } catch (error) {

            console.error(
                "Room check error:",
                error
            );


            return null;

        }

    },


    // =====================================================
    // Join Room
    // =====================================================

    async join(code) {

        const roomCode =
            String(code || "")
                .trim()
                .toUpperCase();


        if (!roomCode) {

            throw new Error(
                "Please enter a room code."
            );

        }


        const room =
            await this.check(
                roomCode
            );


        if (!room) {

            throw new Error(
                "Room not found or expired."
            );

        }


        this.saveRoom(
            room
        );


        return room;

    },


    // =====================================================
    // Save Room
    // =====================================================

    saveRoom(room) {

        if (!room) {

            return;

        }


        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(room)
        );

    },


    // =====================================================
    // Get Saved Room
    // =====================================================

    getSavedRoom() {

        const saved =
            localStorage.getItem(
                this.STORAGE_KEY
            );


        if (!saved) {

            return null;

        }


        try {

            return JSON.parse(
                saved
            );

        } catch (error) {

            console.error(
                "Invalid saved room:",
                error
            );


            this.clear();

            return null;

        }

    },


    // =====================================================
    // Update Local Room
    // =====================================================

    update(data) {

        const room =
            this.getSavedRoom();


        if (!room) {

            return;

        }


        const updated = {

            ...room,

            ...data

        };


        this.saveRoom(
            updated
        );

    },


    // =====================================================
    // Clear Room
    // =====================================================

    clear() {

        localStorage.removeItem(
            this.STORAGE_KEY
        );

    },


    // =====================================================
    // Check Expiration
    // =====================================================

    isExpired(room) {

        if (!room) {

            return true;

        }


        if (!room.expiresAt) {

            return false;

        }


        return (
            Date.now() >=
            Number(room.expiresAt)
        );

    },


    // =====================================================
    // Room URL
    // =====================================================

    getRoomURL(code) {

        const roomCode =
            String(code || "")
                .trim()
                .toUpperCase();


        return (
            `${window.location.origin}/room/${roomCode}`
        );

    },


    // =====================================================
    // Start Expiration Timer
    // =====================================================

    startExpirationTimer(
        expiresAt,
        onExpire
    ) {

        this.stopTimers();


        if (!expiresAt) {

            return null;

        }


        const expiresIn =
            Number(expiresAt) -
            Date.now();


        this.updateCountdown(
            expiresAt
        );


        if (expiresIn <= 0) {

            this.expire(
                onExpire
            );

            return null;

        }


        this.countdownTimer =
            setInterval(
                () => {

                    this.updateCountdown(
                        expiresAt
                    );

                },
                1000
            );


        this.expiryTimer =
            setTimeout(
                () => {

                    this.expire(
                        onExpire
                    );

                },
                expiresIn
            );

    },


    // =====================================================
    // Update Countdown Display
    // =====================================================

    updateCountdown(expiresAt) {

        const element =
            document.getElementById(
                "expirationTime"
            );


        if (!element) {

            return;

        }


        const remaining = Math.max(
            Number(expiresAt) -
                Date.now(),
            0
        );


        element.textContent =
            this.formatRemaining(
                remaining
            );

    },


    // =====================================================
    // Format Remaining Time
    // =====================================================

    formatRemaining(remainingMs) {

        const totalSeconds =
            Math.floor(
                remainingMs / 1000
            );


        const hours = Math.floor(
            totalSeconds / 3600
        );


        const minutes = Math.floor(
            (totalSeconds % 3600) /
                60
        );


        const seconds =
            totalSeconds % 60;


        const pad = (value) =>
            String(value).padStart(
                2,
                "0"
            );


        return (
            `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        );

    },


    // =====================================================
    // Expire Room Locally
    // =====================================================

    expire(onExpire) {

        this.stopTimers();

        this.clear();


        if (
            typeof onExpire ===
            "function"
        ) {

            onExpire();

        }

    },


    // =====================================================
    // Stop Timers
    // =====================================================

    stopTimers() {

        if (
            this.countdownTimer
        ) {

            clearInterval(
                this.countdownTimer
            );

            this.countdownTimer =
                null;

        }


        if (
            this.expiryTimer
        ) {

            clearTimeout(
                this.expiryTimer
            );

            this.expiryTimer =
                null;

        }

    }

};