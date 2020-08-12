const SELECTORS = {
    picker: '.js-themepicker',
    toggleBtn: '.js-themepicker-toggle',
    themeSelectBtn: '.js-themepicker-themeselect',
    closeBtn: '.js-themepicker-close'
}

const CLASSES = {
    active: 'is-active'
}
const THEME_STORAGE_KEY = 'theme'

class ThemePicker {
    constructor() {
        this.activeTheme = 'light'
        this.hasLocalStorage = typeof Storage !== 'undefined'
        this.themeSelectBtns = Array.from(
            document.querySelectorAll(SELECTORS.themeSelectBtn)
        )

        this.init()
    }

    init() {
        const systemPreference = this.getSystemPreference()
        const storedPreference = this.getStoredPreference()

        if (storedPreference) {
            this.activeTheme = storedPreference
        } else if (systemPreference) {
            this.activeTheme = systemPreference
        }

        this.setTheme(this.activeTheme)
        this.bindEvents()
    }

    bindEvents() {
        this.themeSelectBtns.forEach((btn) => {
            const id = btn.dataset.theme
            if (id) {
                btn.addEventListener('click', () => this.setTheme(id));
                btn.blur();
            }
        })
    }

    getSystemPreference() {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark'
        }
        return false
    }

    getStoredPreference() {
        if (this.hasLocalStorage) {
            return localStorage.getItem(THEME_STORAGE_KEY);
            console.log(localStorage.getItem(THEME_STORAGE_KEY));
        }
        return false
    }

    setActiveItem() {
        this.themeSelectBtns.forEach((btn) => {
            btn.parentNode.classList.remove(CLASSES.active)
            btn.removeAttribute('aria-checked')

            if (btn.dataset.theme === this.activeTheme) {
                btn.parentNode.classList.add(CLASSES.active)
                btn.setAttribute('aria-checked', 'true')
            }
        })
    }

    setTheme(id) {
        this.activeTheme = id
        document.documentElement.setAttribute('data-theme', id)

        if (this.hasLocalStorage) {
            localStorage.setItem(THEME_STORAGE_KEY, id)
        }
        this.setActiveItem()
    }

}

if (window.CSS && CSS.supports('color', 'var(--fake-var)')) {
    new ThemePicker()
}
