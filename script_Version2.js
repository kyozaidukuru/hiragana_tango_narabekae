/**
 * ひらがな単語並べ替え - メインスクリプト
 * 
 * 機能：
 * - 五十音表の管理
 * - 濁音・半濁音・小文字の変換
 * - カードのドラッグ&ドロップ
 * - ゲームフロー管理
 */

// ========================================
// ユーティリティ関数
// ========================================

/**
 * 濁音に変換
 */
function applyDakuten(char, isKatakana = false) {
    const map = isKatakana ? {
        'カ': 'ガ', 'キ': 'ギ', 'ク': 'グ', 'ケ': 'ゲ', 'コ': 'ゴ',
        'サ': 'ザ', 'シ': 'ジ', 'ス': 'ズ', 'セ': 'ゼ', 'ソ': 'ゾ',
        'タ': 'ダ', 'チ': 'ヂ', 'ツ': 'ヅ', 'テ': 'デ', 'ト': 'ド',
        'ハ': 'バ', 'ヒ': 'ビ', 'フ': 'ブ', 'ヘ': 'ベ', 'ホ': 'ボ'
    } : {
        'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
        'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
        'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
        'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ'
    };
    return map[char] || char;
}

/**
 * 半濁音に変換
 */
function applyHandakuten(char, isKatakana = false) {
    const map = isKatakana ? {
        'ハ': 'パ', 'ヒ': 'ピ', 'フ': 'プ', 'ヘ': 'ペ', 'ホ': 'ポ'
    } : {
        'は': 'ぱ', 'ひ': 'ぴ', 'ふ': 'ぷ', 'へ': 'ぺ', 'ほ': 'ぽ'
    };
    return map[char] || char;
}

/**
 * 小文字に変換
 */
function applySmall(char, isKatakana = false) {
    const map = isKatakana ? {
        'ア': 'ァ', 'イ': 'ィ', 'ウ': 'ゥ', 'エ': 'ェ', 'オ': 'ォ',
        'ヤ': 'ャ', 'ユ': 'ュ', 'ヨ': 'ョ',
        'ワ': 'ヮ', 'ツ': 'ッ'
    } : {
        'あ': 'ぁ', 'い': 'ぃ', 'う': 'ぅ', 'え': 'ぇ', 'お': 'ぉ',
        'や': 'ゃ', 'ゆ': 'ゅ', 'よ': 'ょ',
        'わ': 'ゎ', 'つ': 'っ'
    };
    return map[char] || char;
}

/**
 * テキストをコピーする
 */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    }
}

/**
 * ローカルストレージから値を取得
 */
function getStorage(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
}

/**
 * ローカルストレージに値を保存
 */
function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ========================================
// ゲーム状態管理
// ========================================

class GameState {
    constructor() {
        this.selectedCharacters = [];
        this.isDakuten = false;
        this.isHandakuten = false;
        this.isSmall = false;
        this.isKatakana = false;
    }

    reset() {
        this.selectedCharacters = [];
        this.isDakuten = false;
        this.isHandakuten = false;
        this.isSmall = false;
    }

    toggleDakuten() {
        this.isDakuten = !this.isDakuten;
        this.isHandakuten = false;
    }

    toggleHandakuten() {
        this.isHandakuten = !this.isHandakuten;
        this.isDakuten = false;
    }

    toggleSmall() {
        this.isSmall = !this.isSmall;
    }

    toggleKatakana() {
        this.isKatakana = !this.isKatakana;
        this.reset();
    }

    addCharacter(char) {
        let selectedChar = char;

        if (this.isDakuten) {
            selectedChar = applyDakuten(char, this.isKatakana);
        } else if (this.isHandakuten) {
            selectedChar = applyHandakuten(char, this.isKatakana);
        }

        if (this.isSmall) {
            selectedChar = applySmall(selectedChar, this.isKatakana);
        }

        this.selectedCharacters.push(selectedChar);
        this.reset();
        return selectedChar;
    }

    removeLastCharacter() {
        return this.selectedCharacters.pop();
    }

    getSelectedWord() {
        return this.selectedCharacters.join('');
    }
}

// ========================================
// カード操作クラス
// ========================================

class CardHandler {
    constructor() {
        this.draggedCard = null;
        this.touchCard = null;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    startDrag(e) {
        this.draggedCard = e.target;
        e.dataTransfer.effectAllowed = 'move';
    }

    endDrag() {
        this.draggedCard = null;
    }

    startTouch(e, card) {
        this.touchCard = card;
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        this.offsetX = touch.clientX - rect.left;
        this.offsetY = touch.clientY - rect.top;
    }

    moveTouch(e, card, container) {
        if (!this.touchCard) return;

        const touch = e.touches[0];
        const containerRect = container.getBoundingClientRect();

        let x = touch.clientX - containerRect.left - this.offsetX;
        let y = touch.clientY - containerRect.top - this.offsetY;

        // 境界チェック
        x = Math.max(0, Math.min(x, containerRect.width - card.offsetWidth));
        y = Math.max(0, Math.min(y, containerRect.height - card.offsetHeight));

        card.style.left = x + 'px';
        card.style.top = y + 'px';
    }

    endTouch() {
        this.touchCard = null;
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyDakuten,
        applyHandakuten,
        applySmall,
        copyToClipboard,
        getStorage,
        setStorage,
        GameState,
        CardHandler
    };
}