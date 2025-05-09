// 获取用户音视频信息
class Gum {
    private stream: MediaStream | null = null;

    constructor() {
        // this.init();
    }

    async getUserMedia() {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        return this.stream;
    }

    getStream() {
        return this.stream;
    }
}

export default new Gum();
