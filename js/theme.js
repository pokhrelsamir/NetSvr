// =========================================================
// NetSvr
// Theme Switcher
// =========================================================

const Theme = {

    STORAGE_KEY: "netsvr_theme",

    elements: {},


    /* -----------------------------------------------------
       Initialize
       ----------------------------------------------------- */

    init() {

        this.elements = {

            toggleButton:
                document.getElementById("themeToggleBtn")

        };


        this.bindEvents();

        this.updateButton();

    },


    /* -----------------------------------------------------
       Event Listeners
       ----------------------------------------------------- */

    bindEvents() {

        this.elements.toggleButton?.addEventListener(
            "click",
            () => this.toggle()
        );


        /*
         * Follow OS changes only while the user
         * has not picked a theme manually.
         */

        try {

            if (
                !localStorage.getItem(this.STORAGE_KEY)
            ) {

                const query =
                    window.matchMedia(
                        "(prefers-color-scheme: light)"
                    );

                const onChange =
                    (event) => {

                        this.set(
                            event.matches ? "light" : "dark"
                        );

                    };


                if (query.addEventListener) {

                    query.addEventListener(
                        "change",
                        onChange
                    );

                } else if (query.addListener) {

                    query.addListener(
                        onChange
                    );

                }

            }

        } catch (error) {

            /* Storage unavailable; theme stays session-only. */

        }

    },


    /* -----------------------------------------------------
       Current Theme
       ----------------------------------------------------- */

    current() {

        return (

            document.documentElement.getAttribute("data-theme") ===
                "light"
                ? "light"
                : "dark"

        );

    },


    /* -----------------------------------------------------
       Apply Theme
       ----------------------------------------------------- */

    set(theme) {

        const next =
            theme === "light" ? "light" : "dark";


        document.documentElement.setAttribute(
            "data-theme",
            next
        );


        try {

            localStorage.setItem(
                this.STORAGE_KEY,
                next
            );

        } catch (error) {

            /* Ignore persistence errors. */

        }


        this.updateButton();

    },


    /* -----------------------------------------------------
       Toggle Theme
       ----------------------------------------------------- */

    toggle() {

        this.set(
            this.current() === "dark" ? "light" : "dark"
        );

    },


    /* -----------------------------------------------------
       Update Toggle Button
       ----------------------------------------------------- */

    updateButton() {

        const button =
            this.elements.toggleButton;

        if (!button) {

            return;

        }


        const isDark =
            this.current() === "dark";


        button.textContent =
            isDark ? "☀️" : "🌙";


        button.title =
            isDark
                ? "Switch to light theme"
                : "Switch to dark theme";


        button.setAttribute(
            "aria-label",
            button.title
        );

    }

};


/* =========================================================
   Initialize
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Theme.init();

    }
);
