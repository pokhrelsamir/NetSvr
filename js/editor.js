// =========================================================
// NetSvr
// Shared Text Editor
// =========================================================

const Editor = {

    elements: {},

    saveTimer: null,

    SAVE_DELAY: 400,


    /* -----------------------------------------------------
       Initialize
    ----------------------------------------------------- */

    init() {

        this.elements = {

            textArea:
                document.getElementById("sharedText"),

            wordCount:
                document.getElementById("wordCount"),

            charCount:
                document.getElementById("charCount"),

            copyButton:
                document.getElementById("copyTextBtn"),

            clearButton:
                document.getElementById("clearTextBtn"),

            syncStatus:
                document.getElementById("syncStatus")

        };


        this.bindEvents();

        this.restoreText();

        this.updateStats();

    },


    /* -----------------------------------------------------
       Event Listeners
    ----------------------------------------------------- */

    bindEvents() {

        this.elements.textArea?.addEventListener(
            "input",
            () => {

                this.updateStats();

                this.setStatus(
                    "Saving..."
                );

                this.scheduleSave();

            }
        );


        this.elements.copyButton?.addEventListener(
            "click",
            () => this.copyText()
        );


        this.elements.clearButton?.addEventListener(
            "click",
            () => this.clearText()
        );

    },


    /* -----------------------------------------------------
       Update Statistics
    ----------------------------------------------------- */

    updateStats() {

        const text =
            this.getText();


        const characters =
            text.length;


        const words =
            this.countWords(text);


        if (this.elements.charCount) {

            this.elements.charCount.textContent =
                characters;

        }


        if (this.elements.wordCount) {

            this.elements.wordCount.textContent =
                words;

        }

    },


    /* -----------------------------------------------------
       Count Words
    ----------------------------------------------------- */

    countWords(text) {

        const trimmed =
            text.trim();


        if (!trimmed) {

            return 0;

        }


        return trimmed
            .split(/\s+/)
            .length;

    },


    /* -----------------------------------------------------
       Get Text
    ----------------------------------------------------- */

    getText() {

        return (
            this.elements.textArea?.value ||
            ""
        );

    },


    /* -----------------------------------------------------
       Set Text
    ----------------------------------------------------- */

    setText(text) {

        if (!this.elements.textArea) {

            return;

        }


        this.elements.textArea.value =
            text || "";


        this.updateStats();

    },


    /* -----------------------------------------------------
       Schedule Save
    ----------------------------------------------------- */

    scheduleSave() {

        clearTimeout(
            this.saveTimer
        );


        this.saveTimer =
            setTimeout(
                () => {

                    this.saveText();

                },
                this.SAVE_DELAY
            );

    },


    /* -----------------------------------------------------
       Save Text
    ----------------------------------------------------- */

    saveText() {

        const room =
            typeof Room !== "undefined"
                ? Room.getSavedRoom()
                : null;


        if (!room) {

            this.setStatus(
                "Not saved"
            );

            return;

        }


        room.text =
            this.getText();


        if (
            typeof Room !== "undefined"
        ) {

            Room.save(room);

        }


        this.setStatus(
            "Saved"
        );

    },


    /* -----------------------------------------------------
       Restore Text
    ----------------------------------------------------- */

    restoreText() {

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


        this.setText(
            room.text || ""
        );


        this.setStatus(
            "Saved"
        );

    },


    /* -----------------------------------------------------
       Copy Text
    ----------------------------------------------------- */

    async copyText() {

        const text =
            this.getText();


        if (!text) {

            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "There is no text to copy."
                );

            }

            return;

        }


        try {

            await navigator.clipboard.writeText(
                text
            );


            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "Text copied!"
                );

            }

        } catch (error) {

            console.error(
                "Copy failed:",
                error
            );


            if (
                typeof UI !== "undefined"
            ) {

                UI.showToast(
                    "Unable to copy text."
                );

            }

        }

    },


    /* -----------------------------------------------------
       Clear Text
    ----------------------------------------------------- */

    clearText() {

        const text =
            this.getText();


        if (!text) {

            return;

        }


        const confirmed =
            window.confirm(
                "Clear all shared text?"
            );


        if (!confirmed) {

            return;

        }


        this.setText(
            ""
        );


        this.saveText();


        if (
            typeof UI !== "undefined"
        ) {

            UI.showToast(
                "Shared text cleared."
            );

        }

    },


    /* -----------------------------------------------------
       Editor Status
    ----------------------------------------------------- */

    setStatus(status) {

        if (
            !this.elements.syncStatus
        ) {

            return;

        }


        this.elements.syncStatus.textContent =
            `● ${status}`;

    }

};


/* =========================================================
   Initialize
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Editor.init();

    }
);