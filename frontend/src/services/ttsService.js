// Text-to-Speech utilities
class TTSService {
  constructor() {
    this.isSupported = "speechSynthesis" in window;
    this.voices = [];
    this.currentUtterance = null;

    if (this.isSupported) {
      this.loadVoices();
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = speechSynthesis.getVoices();
  }

  getVoices() {
    return this.voices.filter((voice) => voice.lang.startsWith("en"));
  }

  speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn("Speech synthesis not supported");
      return Promise.reject(new Error("Speech synthesis not supported"));
    }

    return new Promise((resolve, reject) => {
      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice options
      const voices = this.getVoices();
      if (voices.length > 0) {
        utterance.voice =
          voices.find(
            (voice) =>
              voice.name.includes("Google") ||
              voice.name.includes("Microsoft") ||
              voice.name.includes("Alex")
          ) || voices[0];
      }

      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      utterance.lang = options.lang || "en-US";

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  stop() {
    if (this.isSupported && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  pause() {
    if (this.isSupported && speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
  }

  resume() {
    if (this.isSupported && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  isSpeaking() {
    return this.isSupported && speechSynthesis.speaking;
  }

  isSupportedByBrowser() {
    return this.isSupported;
  }
}

// Create singleton instance
const ttsService = new TTSService();

export default ttsService;
