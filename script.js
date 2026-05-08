document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');
    const headerDesc = document.getElementById('header-desc');

    const cardChecklist = document.getElementById('card-checklist');
    const saveCardsBtn = document.getElementById('save-cards-btn');
    const calcForm = document.getElementById('calc-form');
    // We don't need shopSelect anymore since we changed to autocomplete
    const amountInput = document.getElementById('amount');
    const resultsSection = document.getElementById('results-section');
    const ownedRanking = document.getElementById('owned-ranking');
    const suggestSection = document.getElementById('suggest-section');
    const unownedRanking = document.getElementById('unowned-ranking');

    const totalExpenseEl = document.getElementById('total-expense');
    const trackerList = document.getElementById('tracker-list');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const selectedDateTitle = document.getElementById('selected-date-title');

    // Manual Modal
    const manualRecordModal = document.getElementById('manual-record-modal');
    const manualDate = document.getElementById('manual-date');
    const manualAmount = document.getElementById('manual-amount');
    const manualCard = document.getElementById('manual-card');
    const manualCategory = document.getElementById('manual-category');
    const manualMemo = document.getElementById('manual-memo');
    const manualCancelBtn = document.getElementById('manual-cancel-btn');
    const manualSaveBtn = document.getElementById('manual-save-btn');
    const openManualRecordBtn = document.getElementById('open-manual-record-btn');

    // Modal
    const memoModal = document.getElementById('memo-modal');
    const modalSummary = document.getElementById('modal-summary');
    const memoInput = document.getElementById('memo-input');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');

    // Goal Elements
    const goalAirline = document.getElementById('goal-airline');
    const goalDestination = document.getElementById('goal-destination');
    const goalProgressContainer = document.getElementById('goal-progress-container');
    const goalText = document.getElementById('goal-text');
    const goalRemaining = document.getElementById('goal-remaining');
    const goalProgressBar = document.getElementById('goal-progress-bar');
    
    const goalDestinations = {
        none: 0,
        okinawa: 18000,
        seoul: 15000,
        hawaii: 40000,
        ny: 50000,
        paris: 55000
    };

    const savedGoal = JSON.parse(localStorage.getItem('sim_mile_goal')) || { airline: 'ana', dest: 'none' };
    if(goalAirline) goalAirline.value = savedGoal.airline;
    if(goalDestination) goalDestination.value = savedGoal.dest;

    function saveAndRenderGoal() {
        if(!goalAirline || !goalDestination) return;
        const airline = goalAirline.value;
        const dest = goalDestination.value;
        localStorage.setItem('sim_mile_goal', JSON.stringify({ airline, dest }));
        renderAssetDashboard();
    }

    if(goalAirline) goalAirline.addEventListener('change', saveAndRenderGoal);
    if(goalDestination) goalDestination.addEventListener('change', saveAndRenderGoal);

    // --- State ---
    let ownedCards = JSON.parse(localStorage.getItem('sim_owned_cards')) || [];
    if (ownedCards.length > 0 && typeof ownedCards[0] === 'string') {
        ownedCards = ownedCards.map(id => ({ id: id, balance: 0 }));
        localStorage.setItem('sim_owned_cards', JSON.stringify(ownedCards));
    }
    
    let expenseHistory = JSON.parse(localStorage.getItem('sim_expense_history')) || [];
    
    let currentCalDate = new Date();
    let selectedDateStr = null; // YYYY/MM/DD
    let pendingRecord = null;

    // --- Data: Cards ---
    const baseCardPresets = [
        {
            id: 'smcc_nl', name: '三井住友カード (NL)', group: '三井住友カード', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'Vポイント', unitName: 'pt', anaRate: 0.7, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) {
                    const rate = (custom && custom.customRate) ? custom.customRate : 7.0;
                    this.unitPoints = this.unitAmount * (rate / 100);
                    this.label = `200円/${this.unitPoints}pt (スマホタッチ決済等 ${rate}%)`;
                } else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'smcc_gold_nl', name: '三井住友カード ゴールド (NL)', group: '三井住友カード', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'Vポイント', unitName: 'pt', anaRate: 0.7, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) {
                    const rate = (custom && custom.customRate) ? custom.customRate : 7.0;
                    this.unitPoints = this.unitAmount * (rate / 100);
                    this.label = `200円/${this.unitPoints}pt (スマホタッチ決済等 ${rate}%)`;
                } else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'smcc_platinum_pref', name: '三井住友カード プラチナプリファード', group: '三井住友カード', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'Vポイント', unitName: 'pt', anaRate: 0.7, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) {
                    const rate = (custom && custom.customRate) ? custom.customRate : 7.0;
                    this.unitPoints = this.unitAmount * (rate / 100);
                    this.label = `100円/${this.unitPoints}pt (スマホタッチ決済等 ${rate}%)`;
                } else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'olive_normal', name: 'Olive フレキシブルペイ (一般)', group: '三井住友カード', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'Vポイント', unitName: 'pt', anaRate: 0.7, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) {
                    const rate = (custom && custom.customRate) ? custom.customRate : 7.0;
                    this.unitPoints = this.unitAmount * (rate / 100);
                    this.label = `200円/${this.unitPoints}pt (Vポイントアップ ${rate}%)`;
                } else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'olive_gold', name: 'Olive フレキシブルペイ ゴールド', group: '三井住友カード', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'Vポイント', unitName: 'pt', anaRate: 0.7, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) {
                    const rate = (custom && custom.customRate) ? custom.customRate : 7.0;
                    this.unitPoints = this.unitAmount * (rate / 100);
                    this.label = `200円/${this.unitPoints}pt (Vポイントアップ ${rate}%)`;
                } else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'olive_platinum', name: 'Olive フレキシブルペイ プラチナプリファード', group: '三井住友カード', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'Vポイント', unitName: 'pt', anaRate: 0.7, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) {
                    const rate = (custom && custom.customRate) ? custom.customRate : 7.0;
                    this.unitPoints = this.unitAmount * (rate / 100);
                    this.label = `100円/${this.unitPoints}pt (Vポイントアップ ${rate}%)`;
                } else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'mufg', name: '三菱UFJカード', group: '三菱UFJ・JCB', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'グローバルポイント', unitName: 'pt', anaRate: 0.4, jalRate: 0.4,
            applyBonus: function(shop, custom) {
                if (['mufg_target', 'smcc_mufg_target'].includes(shop.category)) {
                    const rate = (custom && custom.customRate) ? custom.customRate : 19.0;
                    this.unitPoints = this.unitAmount * (rate / 100);
                    this.label = `200円/${this.unitPoints}pt (対象店舗 最大${rate}%)`;
                } else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'jcb_w', name: 'JCB CARD W', group: '三菱UFJ・JCB', unitAmount: 1000, unitPoints: 2, type: 'monthly_total', label: '月間累計1000円/2pt (基本1.0%相当)', pointType: 'Oki Dokiポイント', unitName: 'pt', anaRate: 3, jalRate: 3,
            applyBonus: function(shop) {
                if (shop.id === 'starbucks') { this.unitPoints = 11; this.label = '月間1000円/11pt (スタバ 5.5%相当)'; }
                else if (shop.id === 'amazon') { this.unitPoints = 4; this.label = '月間1000円/4pt (Amazon 2.0%相当)'; }
                else { this.unitPoints = 2; this.label = '月間1000円/2pt (基本1.0%相当)'; }
            }
        },
        {
            id: 'jcb_general', name: 'JCB一般カード', group: '三菱UFJ・JCB', unitAmount: 1000, unitPoints: 1, type: 'monthly_total', label: '月間累計1000円/1pt (基本0.5%相当)', pointType: 'Oki Dokiポイント', unitName: 'pt', anaRate: 3, jalRate: 3,
            applyBonus: function(shop) {
                if (shop.id === 'starbucks') { this.unitPoints = 10; this.label = '月間1000円/10pt (スタバ 5.0%相当)'; }
                else if (shop.id === 'amazon') { this.unitPoints = 3; this.label = '月間1000円/3pt (Amazon 1.5%相当)'; }
                else { this.unitPoints = 1; this.label = '月間累計1000円/1pt (基本0.5%相当)'; }
            }
        },
        {
            id: 'paypay', name: 'PayPayカード', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'PayPayポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0,
            applyBonus: function(shop) {
                if (shop.category === 'yahoo') { this.unitPoints = 5; this.label = '100円/5pt (Yahooショッピング等 5.0%)'; }
                else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'paypay_gold', name: 'PayPayカード ゴールド', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1.5, type: 'per_transaction', label: '100円/1.5pt (基本1.5%)', pointType: 'PayPayポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0,
            applyBonus: function(shop) {
                if (shop.category === 'yahoo') { this.unitPoints = 7; this.label = '100円/7pt (Yahoo等 最大7.0%)'; }
                else { this.unitPoints = 1.5; this.label = '100円/1.5pt (基本1.5%)'; }
            }
        },
        {
            id: 'dcard', name: 'dカード', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'dポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop) {
                if (shop.category === 'dpoint_partner' || shop.id === 'matsukiyo') { this.unitPoints = 2; this.label = '100円/2pt (dポイント特約 2.0%)'; }
                else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'dcard_gold', name: 'dカード GOLD', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'dポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop) {
                if (shop.category === 'dpoint_partner' || shop.id === 'matsukiyo') { this.unitPoints = 2; this.label = '100円/2pt (dポイント特約 2.0%)'; }
                else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'rakuten', name: '楽天カード', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: '楽天ポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop) {
                if (shop.category === 'rakuten') { this.unitPoints = 3; this.label = '100円/3pt (楽天市場 3.0%)'; }
                else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'rakuten_gold', name: '楽天ゴールドカード', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: '楽天ポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop) {
                if (shop.category === 'rakuten') { this.unitPoints = 3; this.label = '100円/3pt (楽天市場 3.0%)'; }
                else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'rakuten_premium', name: '楽天プレミアムカード', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: '楽天ポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop) {
                if (shop.category === 'rakuten') { this.unitPoints = 3; this.label = '100円/3pt (楽天市場 3.0% + 特典)'; }
                else { this.unitPoints = 1; this.label = '100円/1pt (基本1.0%)'; }
            }
        },
        {
            id: 'jal_card', name: 'JALカード (普通)', group: '航空系（JAL・ANA）', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1マイル', pointType: 'JALマイル', unitName: 'マイル', anaRate: 0, jalRate: 1,
            applyBonus: function(shop) {
                if (shop.category === 'jal_tokuyaku' || shop.id === 'aeon') { this.unitPoints = 2; this.label = '200円/2マイル (特約店 1.0%)'; }
                else { this.unitPoints = 1; this.label = '200円/1マイル (基本0.5%)'; }
            }
        },
        {
            id: 'jal_club_a_gold', name: 'JAL CLUB-Aゴールドカード', group: '航空系（JAL・ANA）', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1マイル', pointType: 'JALマイル', unitName: 'マイル', anaRate: 0, jalRate: 1,
            applyBonus: function(shop) {
                if (shop.category === 'jal_tokuyaku') { this.unitPoints = 2; this.label = '100円/2マイル (特約店 2.0%)'; }
                else { this.unitPoints = 1; this.label = '100円/1マイル (基本1.0%)'; }
            }
        },
        {
            id: 'ana_card', name: 'ANAカード (一般)', group: '航空系（JAL・ANA）', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%相当)', pointType: 'Vポイント', unitName: 'pt', anaRate: 1, jalRate: 0, // 200円=1pt=1マイル
            applyBonus: function(shop) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) { this.unitPoints = 14; this.label = '200円/14pt (スマホタッチ決済等 7.0%)'; }
                else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%相当)'; }
            }
        },
        {
            id: 'ana_visa_gold', name: 'ANA VISA ワイドゴールドカード', group: '航空系（JAL・ANA）', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本1.0%相当)', pointType: 'Vポイント', unitName: 'pt', anaRate: 2, jalRate: 0,
            applyBonus: function(shop) {
                if (['smcc_target', 'smcc_mufg_target'].includes(shop.category)) { this.unitPoints = 14; this.label = '200円/14pt (スマホタッチ決済等 7.0%)'; }
                else { this.unitPoints = 1; this.label = '200円/1pt (基本1.0%相当)'; }
            }
        },
        {
            id: 'ana_student', name: 'ANAカード (学生用)', group: '航空系（JAL・ANA）', unitAmount: 1000, unitPoints: 10, type: 'monthly_total', label: '月間累計1000円/10マイル', pointType: 'ANAマイル', unitName: 'マイル', anaRate: 1, jalRate: 0,
            applyBonus: function() { this.label = '月間累計1000円/10マイル (基本1.0%)'; }
        },
        {
            id: 'epos', name: 'エポスカード (通常)', group: 'エポス・流通系', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'エポスポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop, custom) { this.label = '200円/1pt (決済ごとに切り捨て)'; }
        },
        {
            id: 'epos_gold', name: 'エポスカード (ゴールド)', group: 'エポス・流通系', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'エポスポイント', unitName: 'pt', anaRate: 0.6, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (custom && custom.eposShops && custom.eposShops.includes(shop.id)) {
                    this.unitPoints = 3; this.label = '200円/3pt (選べるポイントアップ登録 1.5%)';
                }
                else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'epos_platinum', name: 'エポスカード (プラチナ)', group: 'エポス・流通系', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'エポスポイント', unitName: 'pt', anaRate: 0.6, jalRate: 0.5,
            applyBonus: function(shop, custom) {
                if (custom && custom.eposShops && custom.eposShops.includes(shop.id)) {
                    this.unitPoints = 3; this.label = '200円/3pt (選べるポイントアップ登録 1.5%)';
                }
                else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'micard_plus', name: 'エムアイカード プラス', group: 'エポス・流通系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'エムアイポイント', unitName: 'pt', anaRate: 0.25, jalRate: 0.5,
            applyBonus: function() { this.label = '100円/1pt (基本1.0%)'; }
        },
        {
            id: 'seven_card_plus', name: 'セブンカード・プラス', group: 'エポス・流通系', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'nanacoポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0,
            applyBonus: function(shop) {
                if (shop.id === 'seven') { this.unitPoints = 2; this.label = '200円/2pt (セブン-イレブン 1.0%)'; }
                else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'lumine', name: 'ルミネカード', group: 'その他カード', unitAmount: 1000, unitPoints: 5, type: 'monthly_total', label: '月間累計1000円/5pt (基本0.5%)', pointType: 'JRE POINT', unitName: 'pt', anaRate: 0, jalRate: 0,
            applyBonus: function() { this.label = '月間累計1000円/5pt (基本0.5%)'; }
        },
        {
            id: 'aeon_select', name: 'イオンカードセレクト', group: 'エポス・流通系', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'WAON POINT', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop) {
                if (shop.category === 'aeon_target' || shop.id === 'aeon') { this.unitPoints = 2; this.label = '200円/2pt (イオングループ 1.0%)'; }
                else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'aeon_gold', name: 'イオンゴールドカード', group: 'エポス・流通系', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'WAON POINT', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function(shop) {
                if (shop.category === 'aeon_target' || shop.id === 'aeon') { this.unitPoints = 2; this.label = '200円/2pt (イオングループ 1.0%)'; }
                else { this.unitPoints = 1; this.label = '200円/1pt (基本0.5%)'; }
            }
        },
        {
            id: 'aupay', name: 'au PAY カード', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'Pontaポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function() { this.label = '100円/1pt (基本1.0%)'; }
        },
        {
            id: 'aupay_gold', name: 'au PAY ゴールドカード', group: '通信キャリア・ネット系', unitAmount: 100, unitPoints: 1, type: 'per_transaction', label: '100円/1pt (基本1.0%)', pointType: 'Pontaポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function() { this.label = '100円/1pt (基本1.0%)'; }
        },
        {
            id: 'view_suica', name: '「ビュー・スイカ」カード', group: 'その他カード', unitAmount: 1000, unitPoints: 5, type: 'monthly_total', label: '月間累計1000円/5pt (基本0.5%)', pointType: 'JRE POINT', unitName: 'pt', anaRate: 0, jalRate: 0,
            applyBonus: function() { this.label = '月間累計1000円/5pt (基本0.5%)'; }
        },
        {
            id: 'suica', name: 'Suica等 交通系IC', group: '電子マネー・現金', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: 'JRE POINT', unitName: 'pt', anaRate: 0, jalRate: 0,
            applyBonus: function() { this.label = '200円/1pt (基本0.5%)'; }
        },
        {
            id: 'jal_pay', name: 'JAL Pay', group: '電子マネー・現金', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1マイル', pointType: 'JALマイル', unitName: 'マイル', anaRate: 0, jalRate: 1,
            applyBonus: function() { this.label = '200円/1マイル (基本0.5%)'; }
        },
        {
            id: 'rakuten_edy', name: '楽天Edy', group: '電子マネー・現金', unitAmount: 200, unitPoints: 1, type: 'per_transaction', label: '200円/1pt (基本0.5%)', pointType: '楽天ポイント', unitName: 'pt', anaRate: 0.5, jalRate: 0.5,
            applyBonus: function() { this.label = '200円/1pt (基本0.5%)'; }
        },
        {
            id: 'cash', name: '現金', group: '電子マネー・現金', unitAmount: 1, unitPoints: 0, type: 'per_transaction', label: 'ポイント付与なし', pointType: 'なし', unitName: '', anaRate: 0, jalRate: 0,
            applyBonus: function() { this.label = 'ポイント付与なし'; }
        }
    ];

    const shops = [
        { id: 'normal', name: '指定なし（一般店舗）', category: 'normal', isOnline: false },
        { id: 'seven', name: 'セブン-イレブン', category: 'smcc_mufg_target', isOnline: false },
        { id: 'lawson', name: 'ローソン', category: 'smcc_mufg_target', isOnline: false },
        { id: 'familymart', name: 'ファミリーマート', category: 'normal', isOnline: false },
        { id: 'seicomart', name: 'セイコーマート', category: 'smcc_target', isOnline: false },
        { id: 'mac', name: 'マクドナルド', category: 'smcc_target', isOnline: false },
        { id: 'saizeriya', name: 'サイゼリヤ', category: 'smcc_target', isOnline: false },
        { id: 'sukiya', name: 'すき家', category: 'smcc_target', isOnline: false },
        { id: 'matsuya', name: '松屋', category: 'mufg_target', isOnline: false },
        { id: 'matsunoya', name: '松のや', category: 'mufg_target', isOnline: false },
        { id: 'yoshinoya', name: '吉野家', category: 'normal', isOnline: false },
        { id: 'doutor', name: 'ドトールコーヒー', category: 'smcc_target', isOnline: false },
        { id: 'starbucks', name: 'スターバックス', category: 'jal_tokuyaku', isOnline: false },
        { id: 'matsukiyo', name: 'マツモトキヨシ', category: 'jal_tokuyaku', isOnline: false },
        { id: 'welcia', name: 'ウエルシア', category: 'normal', isOnline: false },
        { id: 'aeon', name: 'イオン', category: 'aeon_target', isOnline: false },
        { id: 'daiei', name: 'ダイエー', category: 'aeon_target', isOnline: false },
        { id: 'maxvalu', name: 'マックスバリュ', category: 'aeon_target', isOnline: false },
        { id: 'amazon', name: 'Amazon', category: 'amazon', isOnline: true },
        { id: 'rakuten_ichiba', name: '楽天市場', category: 'rakuten', isOnline: true },
        { id: 'yahoo_shop', name: 'Yahoo!ショッピング', category: 'yahoo', isOnline: true },
        { id: 'gusto', name: 'ガスト', category: 'smcc_target', isOnline: false },
        { id: 'cocos', name: 'ココス', category: 'smcc_target', isOnline: false },
        { id: 'hama_sushi', name: 'はま寿司', category: 'smcc_target', isOnline: false },
        { id: 'kappa_sushi', name: 'かっぱ寿司', category: 'smcc_target', isOnline: false },
        { id: 'sushiro', name: 'スシロー', category: 'smcc_mufg_target', isOnline: false },
        { id: 'kura_sushi', name: 'くら寿司', category: 'normal', isOnline: false },
        { id: 'mos_burger', name: 'モスバーガー', category: 'smcc_target', isOnline: false },
        { id: 'pizzahut', name: 'ピザハット', category: 'mufg_target', isOnline: false }
    ];

    function switchView(targetId) {
        views.forEach(v => v.classList.remove('active'));
        navBtns.forEach(b => b.classList.remove('active'));
        
        document.getElementById(targetId).classList.add('active');
        document.querySelector(`[data-target="${targetId}"]`).classList.add('active');

        if (targetId === 'view-setup') headerDesc.textContent = "まずは、お持ちのカードを登録してください。";
        else if (targetId === 'view-simulator') headerDesc.textContent = "店舗と金額を入れて一番お得な方法を計算します。";
        else if (targetId === 'view-tracker') {
            headerDesc.textContent = "日々の支払いとお得になったポイントの履歴です。";
            selectedDateStr = null; // reset selection
            renderAssetDashboard();
            renderCalendar();
            renderTracker();
        }
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.target));
    });

    const resetDataBtn = document.getElementById('reset-data-btn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            if (confirm('登録したカードやお小遣い帳の履歴など、すべてのデータが消去されます。本当によろしいですか？')) {
                localStorage.removeItem('sim_owned_cards');
                localStorage.removeItem('sim_expense_history');
                location.reload();
            }
        });
    }

    if (saveCardsBtn) {
        saveCardsBtn.addEventListener('click', () => {
            ownedCards = [];
            document.querySelectorAll('.check-item.selected').forEach(item => {
                const id = item.dataset.id;
                const balance = parseInt(item.querySelector('.balance-input').value) || 0;
                
                let customRate = null;
                const rateInput = item.querySelector('.custom-rate-input');
                if (rateInput) customRate = parseFloat(rateInput.value);
                
                let eposShops = [];
                item.querySelectorAll('.epos-shop-select').forEach(sel => {
                    if (sel.value && sel.value !== 'none') eposShops.push(sel.value);
                });
                
                ownedCards.push({ id, balance, customRate, eposShops });
            });
            localStorage.setItem('sim_owned_cards', JSON.stringify(ownedCards));
            switchView('view-simulator');
        });
    }

    function initSetup() {
        cardChecklist.innerHTML = '';
        
        // Group cards
        const groups = {};
        baseCardPresets.forEach(card => {
            if (!groups[card.group]) groups[card.group] = [];
            groups[card.group].push(card);
        });
        
        for (const [groupName, cards] of Object.entries(groups)) {
            const groupEl = document.createElement('div');
            groupEl.className = 'accordion-group';
            
            const hasSelected = cards.some(c => ownedCards.some(oc => oc.id === c.id));
            if (hasSelected) groupEl.classList.add('open');
            
            const headerHtml = `
                <div class="accordion-header">
                    <span>${groupName}</span>
                    <span class="accordion-icon">▼</span>
                </div>
            `;
            groupEl.insertAdjacentHTML('beforeend', headerHtml);
            
            const contentEl = document.createElement('div');
            contentEl.className = `accordion-content ${hasSelected ? 'active' : ''}`;
            
            cards.forEach(card => {
                const ownedObj = ownedCards.find(c => c.id === card.id);
                const isChecked = ownedObj ? 'checked' : '';
                const selectedClass = ownedObj ? 'selected' : '';
                const balance = ownedObj ? ownedObj.balance : 0;
                
                let extraInputsHtml = '';
                if (['smcc_nl', 'smcc_gold_nl', 'smcc_platinum_pref', 'olive_normal', 'olive_gold', 'olive_platinum', 'mufg'].includes(card.id)) {
                    const defaultRate = card.id === 'mufg' ? 19 : 7;
                    const cRate = (ownedObj && ownedObj.customRate) ? ownedObj.customRate : defaultRate;
                    extraInputsHtml = `
                        <div class="custom-inputs-container mt-2" style="font-size:0.8rem; color:#94a3b8; background:#f1f5f9; border:1px solid #e2e8f0; padding:0.5rem; border-radius:6px; margin-top:0.5rem;">
                            現在の対象店舗還元率: <input type="number" class="custom-rate-input" value="${cRate}" min="0" max="20" step="0.5" style="width:60px; padding:0.2rem; border-radius:4px; border:none; background:#f8fafc; border:1px solid #cbd5e1; color:var(--text-color); margin-left:0.3rem;"> %
                        </div>
                    `;
                }
                
                if (['epos_gold', 'epos_platinum'].includes(card.id)) {
                    let shopOptionsHtml = '<option value="none">指定しない</option>';
                    shops.forEach(s => {
                        if (s.id !== 'normal' && s.id !== 'pointup') {
                            shopOptionsHtml += `<option value="${s.id}">${s.name}</option>`;
                        }
                    });
                    
                    const s1 = (ownedObj && ownedObj.eposShops && ownedObj.eposShops[0]) ? ownedObj.eposShops[0] : 'none';
                    const s2 = (ownedObj && ownedObj.eposShops && ownedObj.eposShops[1]) ? ownedObj.eposShops[1] : 'none';
                    const s3 = (ownedObj && ownedObj.eposShops && ownedObj.eposShops[2]) ? ownedObj.eposShops[2] : 'none';
                    
                    extraInputsHtml = `
                        <div class="custom-inputs-container mt-2" style="font-size:0.8rem; color:#94a3b8; background:#f1f5f9; border:1px solid #e2e8f0; padding:0.5rem; border-radius:6px; margin-top:0.5rem;">
                            <div>選べるポイントアップショップ（3倍）</div>
                            <div style="display:flex; flex-direction:column; gap:0.3rem; margin-top:0.3rem;">
                                <select class="epos-shop-select" style="padding:0.2rem; border-radius:4px; border:none; background:#f8fafc; border:1px solid #cbd5e1; color:var(--text-color);">${shopOptionsHtml}</select>
                                <select class="epos-shop-select" style="padding:0.2rem; border-radius:4px; border:none; background:#f8fafc; border:1px solid #cbd5e1; color:var(--text-color);">${shopOptionsHtml}</select>
                                <select class="epos-shop-select" style="padding:0.2rem; border-radius:4px; border:none; background:#f8fafc; border:1px solid #cbd5e1; color:var(--text-color);">${shopOptionsHtml}</select>
                            </div>
                        </div>
                    `;
                }

                const html = `
                    <label class="check-item ${selectedClass}" data-id="${card.id}">
                        <div class="check-item-main">
                            <input type="checkbox" value="${card.id}" class="card-checkbox" ${isChecked}>
                            <span class="check-item-label">${card.name}</span>
                        </div>
                        <div class="balance-input-container">
                            現在残高: <input type="number" class="balance-input" value="${balance}" min="0"> ${card.unitName}
                        </div>
                        ${extraInputsHtml}
                    </label>
                `;
                contentEl.insertAdjacentHTML('beforeend', html);
            });
            
            groupEl.appendChild(contentEl);
            cardChecklist.appendChild(groupEl);
            
            // Set select values for epos
            cards.forEach(card => {
                if (['epos_gold', 'epos_platinum'].includes(card.id)) {
                    const ownedObj = ownedCards.find(c => c.id === card.id);
                    if (ownedObj && ownedObj.eposShops) {
                        const item = groupEl.querySelector(`[data-id="${card.id}"]`);
                        if (item) {
                            const selects = item.querySelectorAll('.epos-shop-select');
                            if (selects.length === 3) {
                                selects[0].value = ownedObj.eposShops[0] || 'none';
                                selects[1].value = ownedObj.eposShops[1] || 'none';
                                selects[2].value = ownedObj.eposShops[2] || 'none';
                            }
                        }
                    }
                }
            });
        }

        // Accordion toggle logic
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const group = header.parentElement;
                const content = group.querySelector('.accordion-content');
                group.classList.toggle('open');
                if (group.classList.contains('open')) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });

        document.querySelectorAll('.card-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const item = e.target.closest('.check-item');
                if (e.target.checked) item.classList.add('selected');
                else item.classList.remove('selected');
            });
        });
    }

    // --- View 2: Simulator ---
    let selectedShop = null;

    function initSimulator() {
        const shopSearch = document.getElementById('shop-search');
        const shopSuggestions = document.getElementById('shop-suggestions');
        
        if(!shopSearch || !shopSuggestions) return;

        function showSuggestions(query) {
            shopSuggestions.innerHTML = '';
            
            // 検索候補を絞り込み。空の場合は全件（ノーマルを除く）表示。
            let filtered = shops.filter(s => s.id !== 'normal' && s.name.toLowerCase().includes(query.toLowerCase()));
            
            if (filtered.length === 0) {
                shopSuggestions.innerHTML = '<div class="suggestion-item" style="color:#94a3b8; cursor:default;">候補がありません</div>';
                shopSuggestions.classList.remove('hidden');
                return;
            }

            filtered.forEach(shop => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = shop.name;
                div.addEventListener('click', () => {
                    shopSearch.value = shop.name;
                    selectedShop = shop;
                    shopSuggestions.classList.add('hidden');
                });
                shopSuggestions.appendChild(div);
            });
            shopSuggestions.classList.remove('hidden');
        }

        shopSearch.addEventListener('input', (e) => {
            selectedShop = null; // Reset
            showSuggestions(e.target.value);
        });

        shopSearch.addEventListener('focus', (e) => {
            showSuggestions(e.target.value);
        });

        // 外側クリックでサジェストを閉じる
        document.addEventListener('click', (e) => {
            if (!shopSearch.contains(e.target) && !shopSuggestions.contains(e.target)) {
                shopSuggestions.classList.add('hidden');
            }
        });
    }

    function calculatePoints(card, amount, shop, pointCardVal = 'none') {
        const ownedObj = ownedCards.find(c => c.id === card.id);
        
        // Clone card to not mutate original
        const c = { ...card };
        c.applyBonus = card.applyBonus; // copy function
        
        c.applyBonus(shop, ownedObj);
        
        let totalPoints = 0;
        if (c.type === 'per_transaction' || c.type === 'monthly_total') {
            totalPoints = Math.floor(amount / c.unitAmount) * c.unitPoints;
        }
        
        // 提示ポイントの計算
        let presentPoints = 0;
        let presentMiles = 0;
        let presentName = '';
        
        if (pointCardVal !== 'none') {
            const [ptType, ptRateStr] = pointCardVal.split('_');
            const ptRate = ptRateStr === '10' ? 1.0 : 0.5;
            presentPoints = Math.floor(amount * (ptRate / 100));
            // 提示ポイントはマイル換算レート一律0.5とする
            presentMiles = presentPoints * 0.5;
            
            if (ptType === 'vpoint') presentName = 'Vポイント';
            else if (ptType === 'dpoint') presentName = 'dポイント';
            else if (ptType === 'ponta') presentName = 'Pontaポイント';
            else if (ptType === 'rakuten') presentName = '楽天ポイント';
        }
        
        let anaMiles = totalPoints * c.anaRate + presentMiles;
        let jalMiles = totalPoints * c.jalRate + presentMiles;
        let bestMiles = Math.max(anaMiles, jalMiles);
        
        const effectiveRate = amount > 0 ? (bestMiles / amount) * 100 : 0;
        
        return { 
            ...c, 
            totalPoints: totalPoints, 
            anaMiles: anaMiles, 
            jalMiles: jalMiles, 
            totalValue: bestMiles,
            effectiveRate: effectiveRate,
            presentPoints: presentPoints,
            presentName: presentName
        };
    }

    calcForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseInt(amountInput.value) || 0;
        const shopSearchVal = document.getElementById('shop-search').value.trim();
        const pointCardVal = document.getElementById('point-card').value;
        
        let shop = selectedShop;
        if (!shop) {
            shop = shops.find(s => s.name === shopSearchVal);
            if (!shop) {
                // Not found in list, treat as normal shop
                shop = { id: 'custom_' + Date.now(), name: shopSearchVal, category: 'normal', isOnline: false };
            }
        }

        if (amount <= 0 || !shop) return;

        let allResults = baseCardPresets.map(c => calculatePoints(c, amount, shop, pointCardVal));
        allResults.sort((a, b) => b.totalValue - a.totalValue);

        const ownedResults = allResults.filter(r => ownedCards.some(c => c.id === r.id));
        const unownedResults = allResults.filter(r => !ownedCards.some(c => c.id === r.id));

        ownedRanking.innerHTML = '';
        if (ownedResults.length === 0) {
            ownedRanking.innerHTML = '<div class="empty-state">所持カードが登録されていません。「所持カード」タブから登録してください。</div>';
            suggestSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            return;
        }

        const bestOwnedValue = ownedResults[0].totalValue;
        
        ownedResults.forEach((result, index) => {
            ownedRanking.insertAdjacentHTML('beforeend', createRankItemHtml(result, index + 1, shop.name, amount, true));
        });

        const betterUnowned = unownedResults.filter(r => r.totalValue > bestOwnedValue);
        
        suggestSection.classList.remove('hidden');
        const suggestTitle = document.querySelector('#suggest-section .suggest-title');
        
        if (betterUnowned.length > 0) {
            suggestTitle.textContent = '💡 もし持っていれば、もっとお得なカード';
            unownedRanking.innerHTML = '';
            betterUnowned.forEach((result, index) => {
                unownedRanking.insertAdjacentHTML('beforeend', createRankItemHtml(result, index + 1, shop.name, amount, false));
            });
        } else {
            suggestTitle.textContent = '👑 あなたの最強カードです！';
            unownedRanking.innerHTML = `<div class="empty-state" style="color:var(--accent-primary); font-weight:bold; padding: 1.5rem;">これ以上お得なカードはありません！<br>お持ちの「${ownedResults[0].name}」が最もお得な支払い方法です。</div>`;
        }

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function createRankItemHtml(result, rank, shopName, amount, isOwned) {
        const rankClass = rank <= 3 && isOwned ? `rank-${rank}` : '';
        const anaDisplay = Number.isInteger(result.anaMiles) ? result.anaMiles : result.anaMiles.toFixed(1);
        const jalDisplay = Number.isInteger(result.jalMiles) ? result.jalMiles : result.jalMiles.toFixed(1);
        const ptsDisplay = Number.isInteger(result.totalPoints) ? result.totalPoints : result.totalPoints.toFixed(1);
        const displayRate = result.effectiveRate.toFixed(2);
        
        let presentHtml = '';
        if (result.presentPoints > 0) {
            presentHtml = `<div style="font-size: 0.85rem; color: #f59e0b; margin-top: 2px;">📱提示ボーナス: +${result.presentPoints}pt (${result.presentName})</div>`;
        }
        
        let recordBtnHtml = '';
        if (isOwned) {
            const paramsObj = {
                shopName, amount, cardName: result.name, points: result.totalPoints, unitName: result.unitName,
                presentPoints: result.presentPoints, presentName: result.presentName
            };
            const params = encodeURIComponent(JSON.stringify(paramsObj));
            recordBtnHtml = `<button class="record-btn" onclick="window.openMemoModal('${params}')">この内容で記録する</button>`;
        }

        return `
            <div class="rank-item ${rankClass}" style="animation: slideIn 0.4s ease-out both;">
                <div class="rank-item-header">
                    ${isOwned ? `<div class="rank-badge">${rank}</div>` : `<div class="rank-badge" style="background:#475569; font-size:0.9rem">提案</div>`}
                    <div class="card-info" style="flex:1">
                        <div class="card-name">${result.name}</div>
                        <div class="card-details">${result.label}</div>
                        ${presentHtml}
                    </div>
                    <div class="card-stats" style="text-align: right;">
                        <div style="display:flex; justify-content: flex-end; gap: 8px; margin-bottom: 2px;">
                            <div class="point-value" style="font-size:1.1rem; color:#60a5fa;">ANA: ${anaDisplay}</div>
                            <div class="point-value" style="font-size:1.1rem; color:#f87171;">JAL: ${jalDisplay}</div>
                        </div>
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px;">(${ptsDisplay} ${result.unitName} から交換)</div>
                        <div class="rate-value">マイル還元率: ${displayRate}%</div>
                    </div>
                </div>
                ${recordBtnHtml}
            </div>
        `;
    }

    // --- Modal Logic ---
    window.openMemoModal = function(encodedParams) {
        pendingRecord = JSON.parse(decodeURIComponent(encodedParams));
        const pts = Number.isInteger(pendingRecord.points) ? pendingRecord.points : pendingRecord.points.toFixed(2);
        
        let summaryText = `${pendingRecord.shopName} で ¥${pendingRecord.amount.toLocaleString()} 支払い (${pendingRecord.cardName} / ${pts}${pendingRecord.unitName})`;
        if (pendingRecord.presentPoints > 0) {
            summaryText += ` + 提示 ${pendingRecord.presentPoints}pt (${pendingRecord.presentName})`;
        }
        
        modalSummary.textContent = summaryText;
        memoInput.value = '';
        memoModal.classList.remove('hidden');
    };

    modalCancelBtn.addEventListener('click', () => {
        memoModal.classList.add('hidden');
        pendingRecord = null;
    });

    modalSaveBtn.addEventListener('click', () => {
        if (!pendingRecord) return;
        const today = new Date();
        const dateStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
        
        expenseHistory.unshift({
            id: Date.now(),
            date: dateStr,
            shopName: pendingRecord.shopName,
            amount: pendingRecord.amount,
            cardName: pendingRecord.cardName,
            points: pendingRecord.points,
            unitName: pendingRecord.unitName,
            presentPoints: pendingRecord.presentPoints,
            presentName: pendingRecord.presentName,
            category: document.getElementById('record-category').value,
            memo: memoInput.value.trim()
        });
        
        localStorage.setItem('sim_expense_history', JSON.stringify(expenseHistory));
        memoModal.classList.add('hidden');
        pendingRecord = null;
        alert('お小遣い帳に記録しました！');
    });

    // --- View 3: Tracker & Calendar ---
    document.getElementById('prev-month').addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        selectedDateStr = null;
        renderCalendar();
        renderTracker();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        selectedDateStr = null;
        renderCalendar();
        renderTracker();
    });

    function getFormattedDate(year, month, day) {
        return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        
        calendarMonthYear.textContent = `${year}年 ${month + 1}月`;

        // Days of week header
        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
        daysOfWeek.forEach(d => {
            calendarGrid.insertAdjacentHTML('beforeend', `<div class="cal-day-header">${d}</div>`);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty cells for first week
        for (let i = 0; i < firstDay; i++) {
            calendarGrid.insertAdjacentHTML('beforeend', `<div class="cal-day empty"></div>`);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = getFormattedDate(year, month + 1, day);
            const hasRecord = expenseHistory.some(r => r.date === dateStr);
            const isSelected = selectedDateStr === dateStr;
            
            const cell = document.createElement('div');
            cell.className = `cal-day ${hasRecord ? 'has-record' : ''} ${isSelected ? 'active' : ''}`;
            cell.textContent = day;
            
            if (hasRecord) {
                cell.insertAdjacentHTML('beforeend', `<div class="cal-dot"></div>`);
            }

            cell.addEventListener('click', () => {
                if (selectedDateStr === dateStr) {
                    selectedDateStr = null; // toggle off
                } else {
                    selectedDateStr = dateStr;
                }
                renderCalendar(); // re-render to update active state
                renderTracker();
            });

            calendarGrid.appendChild(cell);
        }
    }


    // --- Manual Record Logic ---
    if(openManualRecordBtn) {
        openManualRecordBtn.addEventListener('click', () => {
            manualDate.value = new Date().toISOString().split('T')[0];
            manualAmount.value = '';
            manualMemo.value = '';
            
            manualCard.innerHTML = '';
            ownedCards.forEach(oc => {
                const preset = baseCardPresets.find(p => p.id === oc.id);
                if (preset) {
                    manualCard.insertAdjacentHTML('beforeend', `<option value="${preset.id}">${preset.name}</option>`);
                }
            });
            
            manualRecordModal.classList.remove('hidden');
        });
    }

    if(manualCancelBtn) {
        manualCancelBtn.addEventListener('click', () => {
            manualRecordModal.classList.add('hidden');
        });
    }

    if(manualSaveBtn) {
        manualSaveBtn.addEventListener('click', () => {
            const amount = parseInt(manualAmount.value);
            const dateStr = manualDate.value.replace(/-/g, '/');
            const cardId = manualCard.value;
            
            if(!amount || !dateStr || !cardId) return alert('日付と金額を正しく入力してください');
            
            const preset = baseCardPresets.find(p => p.id === cardId);
            const totalPoints = (preset.type === 'per_transaction' || preset.type === 'monthly_total') ? Math.floor(amount / preset.unitAmount) * preset.unitPoints : 0;
            
            expenseHistory.unshift({
                id: Date.now(),
                date: dateStr,
                shopName: manualCategory.value, // 手動の場合は店名の代わりにカテゴリー名を表示
                amount: amount,
                cardName: preset.name,
                points: totalPoints,
                unitName: preset.unitName,
                category: manualCategory.value,
                memo: manualMemo.value.trim()
            });
            
            localStorage.setItem('sim_expense_history', JSON.stringify(expenseHistory));
            manualRecordModal.classList.add('hidden');
            renderCalendar();
            renderTracker();
        });
    }

    function renderAssetDashboard() {
        const assetList = document.getElementById('asset-list');
        if(!assetList) return;
        assetList.innerHTML = '';

        const pointTotals = {};
        
        ownedCards.forEach(oc => {
            const preset = baseCardPresets.find(p => p.id === oc.id);
            if (preset && oc.balance > 0) {
                if (!pointTotals[preset.pointType]) pointTotals[preset.pointType] = { amount: 0, anaRate: preset.anaRate, jalRate: preset.jalRate };
                pointTotals[preset.pointType].amount += oc.balance;
                pointTotals[preset.pointType].anaRate = Math.max(pointTotals[preset.pointType].anaRate, preset.anaRate);
                pointTotals[preset.pointType].jalRate = Math.max(pointTotals[preset.pointType].jalRate, preset.jalRate);
            }
        });

        expenseHistory.forEach(record => {
            const preset = baseCardPresets.find(p => p.name === record.cardName);
            if(preset) {
                if (!pointTotals[preset.pointType]) pointTotals[preset.pointType] = { amount: 0, anaRate: preset.anaRate, jalRate: preset.jalRate };
                
                if (preset.pointType === 'なし') {
                    // 現金（pointType === 'なし'）の場合は支出額を減算
                    pointTotals[preset.pointType].amount -= record.amount;
                } else if (record.points) {
                    // その他のポイントは獲得ポイントを加算
                    pointTotals[preset.pointType].amount += record.points;
                }
                
                pointTotals[preset.pointType].anaRate = Math.max(pointTotals[preset.pointType].anaRate, preset.anaRate);
                pointTotals[preset.pointType].jalRate = Math.max(pointTotals[preset.pointType].jalRate, preset.jalRate);
            }
        });

        let totalAna = 0;
        let totalJal = 0;

        const keys = Object.keys(pointTotals);
        if (keys.length === 0) {
            assetList.innerHTML = '<div class="empty-state">ポイント残高がありません。<br>所持カード画面で現在残高を入力するか、記録を追加してください。</div>';
            return;
        }

        keys.sort((a,b) => pointTotals[b].amount - pointTotals[a].amount).forEach(type => {
            const pt = pointTotals[type];
            totalAna += pt.amount * pt.anaRate;
            totalJal += pt.amount * pt.jalRate;
            
            const val = Number.isInteger(pt.amount) ? pt.amount.toLocaleString() : pt.amount.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:1});
            assetList.insertAdjacentHTML('beforeend', `
                <div class="asset-item">
                    <div class="asset-name">${type}</div>
                    <div class="asset-value">${val}</div>
                </div>
            `);
        });
        
        const anaEl = document.getElementById('total-ana-miles');
        const jalEl = document.getElementById('total-jal-miles');
        if(anaEl) anaEl.textContent = Math.floor(totalAna).toLocaleString();
        if(jalEl) jalEl.textContent = Math.floor(totalJal).toLocaleString();
        
        // Goal update
        if(goalAirline && goalDestination) {
            const dest = goalDestination.value;
            const requiredMiles = goalDestinations[dest];
            if(requiredMiles > 0) {
                goalProgressContainer.classList.remove('hidden');
                const isAna = goalAirline.value === 'ana';
                const currentMiles = isAna ? totalAna : totalJal;
                const airlineName = isAna ? 'ANA' : 'JAL';
                const destName = goalDestination.options[goalDestination.selectedIndex].text.split(' ')[0];
                
                goalText.textContent = `${airlineName}で${destName}へ (${Math.floor(currentMiles).toLocaleString()} / ${requiredMiles.toLocaleString()})`;
                
                if (currentMiles >= requiredMiles) {
                    goalRemaining.textContent = '🎉 目標達成！';
                    goalRemaining.style.color = '#34d399';
                    goalProgressBar.style.width = '100%';
                    goalProgressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
                } else {
                    const diff = requiredMiles - currentMiles;
                    goalRemaining.textContent = `あと ${Math.floor(diff).toLocaleString()} マイル`;
                    goalRemaining.style.color = '#f8fafc';
                    goalProgressBar.style.width = `${Math.min((currentMiles / requiredMiles) * 100, 100)}%`;
                    goalProgressBar.style.background = 'linear-gradient(90deg, #38bdf8, #818cf8)';
                }
            } else {
                goalProgressContainer.classList.add('hidden');
            }
        }
    }
    function renderTracker() {
        trackerList.innerHTML = '';
        
        // Filter by month
        const year = currentCalDate.getFullYear();
        const monthStr = String(currentCalDate.getMonth() + 1).padStart(2, '0');
        const monthPrefix = `${year}/${monthStr}`;
        
        let displayHistory = expenseHistory.filter(r => r.date.startsWith(monthPrefix));
        
        // Calculate monthly total
        let monthlyTotal = displayHistory.reduce((sum, r) => sum + r.amount, 0);
        totalExpenseEl.textContent = `¥${monthlyTotal.toLocaleString()}`;

        // Filter by selected date if any
        if (selectedDateStr) {
            displayHistory = displayHistory.filter(r => r.date === selectedDateStr);
            selectedDateTitle.textContent = `${selectedDateStr} の履歴`;
        } else {
            selectedDateTitle.textContent = `${year}年${monthStr}月のすべての履歴`;
        }
        
        if (displayHistory.length === 0) {
            trackerList.innerHTML = '<div class="empty-state">該当する記録がありません。</div>';
            return;
        }

        displayHistory.forEach(record => {
            const pointsDisplay = Number.isInteger(record.points) ? record.points : record.points.toFixed(2);
            const memoHtml = record.memo ? `<div class="record-memo">📝 ${record.memo}</div>` : '';
            const categoryHtml = record.category ? `<span style="font-size:0.75rem; background:rgba(255,255,255,0.1); padding:0.1rem 0.4rem; border-radius:4px; margin-right:0.4rem;">${record.category}</span>` : '';
            
            const html = `
                <div class="record-item">
                    <div style="flex:1;">
                        <div class="record-date">${record.date}</div>
                        <div class="record-shop">${categoryHtml}${record.shopName}</div>
                        ${memoHtml}
                    </div>
                    <div style="text-align: right; min-width: 120px;">
                        <div class="record-amount">¥${record.amount.toLocaleString()}</div>
                        <div class="record-card">${record.cardName} (${pointsDisplay}${record.unitName})</div>
                    </div>
                </div>
            `;
            trackerList.insertAdjacentHTML('beforeend', html);
        });
    }

    // Initialization
    initSetup();
    initSimulator();

    if (ownedCards.length > 0) {
        switchView('view-simulator');
    } else {
        switchView('view-setup');
    }
});
