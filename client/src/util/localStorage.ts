class LocalStorage {
    private readonly prefix = "myclient";
    private readonly authTokenKey = `${this.prefix}_authToken`;

    addAuthToken(token: string) {
        localStorage.setItem(this.authTokenKey, token);
    }

    removeAuthToken() {
        localStorage.removeItem(this.authTokenKey);
    }

    getAuthToken() {
        return localStorage.getItem(this.authTokenKey);
    }
}

const clientLocalStorage = new LocalStorage();

export default clientLocalStorage;
