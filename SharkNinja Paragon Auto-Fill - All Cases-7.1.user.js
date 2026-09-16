// ==UserScript==
// @name         SharkNinja Paragon Auto-Fill - All Cases
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  Auto-fills Paragon case creation form for all SharkNinja Loading Summary emails with built-in email editor
// @author       @neelkml
// @match        https://paragon-eu.amazon.com/hz/create-case*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    // ─── DATE ─────────────────────────────────────────────────────────────────
    const TODAY = new Date();
    const DD    = String(TODAY.getDate()).padStart(2, '0');
    const MM    = String(TODAY.getMonth() + 1).padStart(2, '0');
    const YYYY  = TODAY.getFullYear();
    const DATE  = `${DD}/${MM}/${YYYY}`;

    // ─── DEFAULT CASE CONFIGS ─────────────────────────────────────────────────
    const DEFAULTS = [
        {
            id: 'sn-europe',
            label: '🇬🇧 SN Europe',
            color: '#FF9900',
            subject: `SharkNinja Europe Ltd Loading Summary from ${DATE}`,
            cc: [
                'LRoberts@sharkninja.com',
                'EMitchell@sharkninja.com',
                'joe.reid@xpo.com',
                'phillip.hastings@xpo.com',
                'cristina.bernadette@xpo.com',
                'mwilk@sharkninja.com',
                'Luke.Reynolds@sharkninja.com',
                'lucy.ball@xpo.com',
                'Christopher.Hardy1@xpo.com',
                'clavarin@amazon.co.uk',
                'XPO_Shark_Ninja@xpo.com',
                'JPare@sharkninja.com',
                'aggoleva@amazon.com'
            ],
            body: `Good afternoon, team

Kindly review the attached latest loading summary and confirm if Corby has sufficient trailers to cover all preload collections?

We have the opportunity to pull forward orders so please advise if you have availability to load any of your orders earlier

Also, please let us know if you require any changes to be made. `
        },
        {
            id: 'sn-dsf-france',
            label: '🇫🇷 SN DSF France',
            color: '#0055A4',
            subject: `SharkNinja Germany Gmbh Loading Summary for DSF France - ${DATE}`,
            cc: [
                'svijayvagia@sharkninja.com',
                'quentin.balourdet@dsv.com',
                'fr.sharkninja.adm@fr.dsv.com',
                'samantha.seiwerling@dsv.com',
                'david.laurent@fr.dsv.com',
                'ilyasse.el-marssi@dsv.com',
                'moussyb2b.sharkninja2@fr.dsv.com',
                'KWarzala@sharkninja.com',
                'EMitchell@sharkninja.com',
                'GMbaya@sharkninja.com',
                'aggoleva@amazon.com'
            ],
            body: `Good afternoon, Team

please find the summary being sent to updated emails.

Kindly review and acknowledge the attached latest loading summary for ${DATE}

We have opportunity to pull forward orders, so please confirm if there are any orders you would like us to pull forward for you. `
        },
        {
            id: 'sn-dsv-tholen',
            label: '🇳🇱 SN DSV Tholen',
            color: '#009B77',
            subject: `SharkNinja Germany Gmbh Loading Summary for DSV Tholen - ${DATE}`,
            cc: [
                'nl.sha.cs.sn.tho.out@dsv.com',
                'svijayvagia@sharkninja.com',
                'KWarzala@sharkninja.com',
                'EMitchell@sharkninja.com',
                'Kymo.Engelman@sharkninja.com',
                'CMia@sharkninja.com',
                'aggoleva@amazon.com'
            ],
            body: `Good afternoon, team,

Kindly review and acknowledge the attached latest loading summary for ${DATE}

We have opportunity to pull forward orders, so please confirm if there are any orders you would like us to pull forward for you. `
        },
        {
            id: 'sn-kn-poland',
            label: '🇵🇱 SN K+N Poland',
            color: '#DC143C',
            subject: `SharkNinja Germany Gmbh Loading Summary for K+N Poland - ${DATE}`,
            cc: [
                'ewelina.franczak@kuehne-nagel.com',
                'tomasz.miastowski@kuehne-nagel.com',
                'milena.lechowska@kuehne-nagel.com',
                'pl-sn-transport@Kuehne-Nagel.com',
                'cmia@sharkninja.com',
                'sn.inbound@kuehne-nagel.com',
                'Lukasz.Miastowski@kuehne-nagel.com'
            ],
            body: `Good afternoon, team,

Kindly review and acknowledge the attached latest loading summary for ${DATE}

We have opportunity to pull forward orders, so please confirm if there are any orders you would like us to pull forward for you. `
        }
    ];

    // ─── GM STORAGE ───────────────────────────────────────────────────────────
    const STORAGE_KEY = 'sn_autofill_cc_lists';

    function loadCCLists() {
        try {
            const saved = GM_getValue(STORAGE_KEY, null);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    }

    function saveCCLists(data) {
        try {
            GM_setValue(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[SN AutoFill] Failed to save:', e);
        }
    }

    function getCases() {
        const saved = loadCCLists();
        return DEFAULTS.map(c => ({
            ...c,
            subject: c.subject,
            cc: (saved && saved[c.id]) ? saved[c.id] : [...c.cc]
        }));
    }

    function saveCaseCC(caseId, ccArray) {
        const saved = loadCCLists() || {};
        saved[caseId] = ccArray;
        saveCCLists(saved);
    }

    function resetCaseCC(caseId) {
        const saved = loadCCLists() || {};
        delete saved[caseId];
        saveCCLists(saved);
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function setNativeValue(el, value) {
        const proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, value);
        else el.value = value;
        ['input', 'change', 'blur'].forEach(e =>
            el.dispatchEvent(new Event(e, { bubbles: true }))
        );
    }

    function waitFor(fn, timeout = 10000, interval = 300) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = fn();
                if (el) return resolve(el);
                if (Date.now() - start > timeout) return reject(new Error('Timeout'));
                setTimeout(check, interval);
            };
            check();
        });
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    // ─── FIELD FINDERS ────────────────────────────────────────────────────────
    function getSubjectField() {
        const byId = document.getElementById('katal-id-7');
        if (byId) return byId;
        return [...document.querySelectorAll('input[placeholder="This field is required."]')]
            .find(el => el.offsetParent !== null) || null;
    }

    function getCCField() {
        // CC = second (lower) input-group-tags with email placeholder
        // Confirmed: #1 top:175px = To, #2 top:221px = CC
        const all = [...document.querySelectorAll('input#input-group-tags')]
            .filter(el => el.placeholder.toLowerCase().includes('email'))
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        return all[1] || null;
    }

    function getBodyField() {
        return document.querySelector('textarea[placeholder="Insert email body here"]') || null;
    }

    // ─── FILL TAG INPUT ───────────────────────────────────────────────────────
    async function fillTagInput(el, emails) {
        el.focus();
        await sleep(100);
        for (const email of emails) {
            setNativeValue(el, email);
            await sleep(150);
            [
                ['keydown',  ' ',     32 ],
                ['keypress', ' ',     32 ],
                ['keyup',    ' ',     32 ],
                ['keydown',  ',',     188],
                ['keypress', ',',     188],
                ['keyup',    ',',     188],
                ['keydown',  'Enter', 13 ],
                ['keyup',    'Enter', 13 ],
            ].forEach(([type, key, code]) =>
                el.dispatchEvent(new KeyboardEvent(type, { key, keyCode: code, bubbles: true }))
            );
            await sleep(200);
        }
    }

    // ─── FILL FORM ────────────────────────────────────────────────────────────
    async function fillForm(caseConfig, statusEl) {
        const results = { subject: false, cc: false, body: false };

        try {
            // Subject
            statusEl.textContent = '⏳ Filling subject...';
            const subjectEl = await waitFor(getSubjectField).catch(() => null);
            if (subjectEl) {
                subjectEl.focus();
                setNativeValue(subjectEl, caseConfig.subject);
                results.subject = true;
                console.log('[SN AutoFill] ✓ Subject filled');
            } else {
                console.warn('[SN AutoFill] ✗ Subject field not found');
            }
            await sleep(300);

            // CC
            statusEl.textContent = '⏳ Filling CC emails...';
            const ccEl = await waitFor(getCCField).catch(() => null);
            if (ccEl) {
                await fillTagInput(ccEl, caseConfig.cc);
                results.cc = true;
                console.log('[SN AutoFill] ✓ CC filled with', caseConfig.cc.length, 'emails');
            } else {
                console.warn('[SN AutoFill] ✗ CC field not found');
            }
            await sleep(300);

            // Body
            statusEl.textContent = '⏳ Filling body...';
            const bodyEl = await waitFor(getBodyField).catch(() => null);
            if (bodyEl) {
                bodyEl.focus();
                setNativeValue(bodyEl, caseConfig.body);
                results.body = true;
                console.log('[SN AutoFill] ✓ Body filled');
            } else {
                console.warn('[SN AutoFill] ✗ Body field not found');
            }

        } catch (err) {
            console.error('[SN AutoFill] Error:', err);
        }

        const allOk   = Object.values(results).every(Boolean);
        const missing = Object.entries(results).filter(([,v]) => !v).map(([k]) => k).join(', ');
        statusEl.style.color = allOk ? '#2ea44f' : '#dc3545';
        statusEl.textContent = allOk
            ? '✅ All fields filled successfully!'
            : `⚠️ Missing: ${missing} — check console`;
        return allOk;
    }

    // ─── STYLES ───────────────────────────────────────────────────────────────
    const S = {
        overlay:     `position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,0.55);
                      display:flex;align-items:center;justify-content:center;
                      font-family:"Amazon Ember",Arial,sans-serif;`,
        dialog:      `background:#fff;border-radius:12px;padding:28px 32px;width:460px;
                      max-height:90vh;overflow-y:auto;
                      box-shadow:0 8px 32px rgba(0,0,0,0.25);position:relative;`,
        closeBtn:    `position:absolute;top:12px;right:16px;background:none;border:none;
                      font-size:18px;cursor:pointer;color:#666;line-height:1;`,
        title:       `margin:0 0 4px 0;font-size:17px;color:#111;font-weight:700;`,
        subtitle:    `margin:0 0 16px 0;font-size:13px;color:#666;`,
        divider:     `border:none;border-top:1px solid #eee;margin:0 0 16px 0;`,
        grid:        `display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;`,
        caseBtn:     c => `background:${c};color:#fff;border:none;border-radius:8px;
                      padding:14px 10px;font-size:13px;font-weight:bold;cursor:pointer;
                      box-shadow:0 2px 6px rgba(0,0,0,0.15);
                      transition:opacity 0.2s,transform 0.1s;`,
        editBtn:     `width:100%;background:#f5f5f5;color:#333;border:1px solid #ddd;
                      border-radius:8px;padding:10px;font-size:13px;font-weight:600;
                      cursor:pointer;margin-bottom:12px;transition:background 0.2s;`,
        status:      `font-size:13px;color:#555;min-height:20px;text-align:center;
                      margin-top:4px;`,
        footer:      `margin:12px 0 0 0;font-size:11px;color:#999;text-align:center;`,
        credit:      `margin:4px 0 0 0;font-size:11px;color:#bbb;text-align:center;
                      letter-spacing:0.3px;`,
        // Editor
        editorPanel: `margin-top:16px;border-top:1px solid #eee;padding-top:16px;`,
        editorTitle: `font-size:14px;font-weight:700;color:#111;margin:0 0 12px 0;`,
        tabBar:      `display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;`,
        tab:         (active, color) =>
                     `padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;
                      cursor:pointer;border:2px solid ${color};
                      background:${active ? color : '#fff'};
                      color:${active ? '#fff' : color};transition:all 0.15s;`,
        emailList:   `list-style:none;margin:0 0 10px 0;padding:0;max-height:180px;
                      overflow-y:auto;border:1px solid #eee;border-radius:8px;`,
        emailItem:   `display:flex;align-items:center;justify-content:space-between;
                      padding:7px 10px;border-bottom:1px solid #f0f0f0;
                      font-size:12px;color:#333;`,
        removeBtn:   `background:#fee;color:#c00;border:none;border-radius:4px;
                      padding:2px 8px;cursor:pointer;font-size:11px;font-weight:600;
                      white-space:nowrap;margin-left:8px;`,
        addRow:      `display:flex;gap:8px;margin-top:8px;`,
        addInput:    `flex:1;padding:8px 10px;border:1px solid #ddd;border-radius:6px;
                      font-size:12px;outline:none;`,
        addBtn:      `padding:8px 14px;background:#232F3E;color:#FF9900;border:none;
                      border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;`,
        resetBtn:    `width:100%;margin-top:10px;padding:7px;background:#fff;color:#999;
                      border:1px solid #ddd;border-radius:6px;font-size:11px;cursor:pointer;`,
        saveNote:    `font-size:11px;color:#2ea44f;text-align:center;
                      margin-top:6px;min-height:16px;`,
    };

    function mk(tag, style, text) {
        const e = document.createElement(tag);
        if (style) e.style.cssText = style;
        if (text)  e.textContent = text;
        return e;
    }

    // ─── EMAIL EDITOR ─────────────────────────────────────────────────────────
    function buildEditor(cases, onSave) {
        let activeCaseIdx = 0;
        let workingCC = cases.map(c => [...c.cc]);

        const panel    = mk('div', S.editorPanel);
        const title    = mk('h3', S.editorTitle, '⚙️ Edit CC Email Lists');
        const tabBar   = mk('div', S.tabBar);
        const content  = mk('div', '');
        const saveNote = mk('div', S.saveNote);

        panel.appendChild(title);
        panel.appendChild(tabBar);
        panel.appendChild(content);
        panel.appendChild(saveNote);

        function renderTabs() {
            tabBar.innerHTML = '';
            cases.forEach((c, i) => {
                const tab = mk('button', S.tab(i === activeCaseIdx, c.color), c.label);
                tab.addEventListener('click', () => {
                    activeCaseIdx = i;
                    renderTabs();
                    renderContent();
                });
                tabBar.appendChild(tab);
            });
        }

        function renderContent() {
            content.innerHTML = '';
            const c      = cases[activeCaseIdx];
            const emails = workingCC[activeCaseIdx];

            const list = mk('ul', S.emailList);
            if (emails.length === 0) {
                const empty = mk('li',
                    S.emailItem + 'color:#aaa;justify-content:center;',
                    'No emails — add one below');
                list.appendChild(empty);
            } else {
                emails.forEach((email, idx) => {
                    const item  = mk('li', S.emailItem);
                    const span  = mk('span', 'flex:1;word-break:break-all;', email);
                    const rmBtn = mk('button', S.removeBtn, '✕ Remove');
                    rmBtn.addEventListener('click', () => {
                        workingCC[activeCaseIdx].splice(idx, 1);
                        renderContent();
                        autoSave();
                    });
                    item.appendChild(span);
                    item.appendChild(rmBtn);
                    list.appendChild(item);
                });
            }

            const addRow = mk('div', S.addRow);
            const input  = mk('input', S.addInput);
            input.type        = 'text';
            input.placeholder = 'new.email@example.com';
            const addBtn = mk('button', S.addBtn, '+ Add');

            function addEmail() {
                const val = input.value.trim();
                if (!val) return;
                if (!isValidEmail(val)) {
                    saveNote.style.color = '#dc3545';
                    saveNote.textContent = '⚠️ Invalid email address';
                    setTimeout(() => saveNote.textContent = '', 2500);
                    return;
                }
                if (workingCC[activeCaseIdx].includes(val)) {
                    saveNote.style.color = '#dc3545';
                    saveNote.textContent = '⚠️ Email already in list';
                    setTimeout(() => saveNote.textContent = '', 2500);
                    return;
                }
                workingCC[activeCaseIdx].push(val);
                input.value = '';
                renderContent();
                autoSave();
            }

            addBtn.addEventListener('click', addEmail);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); addEmail(); }
            });

            addRow.appendChild(input);
            addRow.appendChild(addBtn);

            const resetBtn = mk('button', S.resetBtn,
                `🔄 Reset "${c.label}" to defaults`);
            resetBtn.addEventListener('click', () => {
                const def = DEFAULTS.find(d => d.id === c.id);
                if (def) {
                    workingCC[activeCaseIdx] = [...def.cc];
                    resetCaseCC(c.id);
                    renderContent();
                    saveNote.style.color = '#2ea44f';
                    saveNote.textContent = '✅ Reset to defaults';
                    setTimeout(() => saveNote.textContent = '', 2500);
                    onSave(c.id, workingCC[activeCaseIdx]);
                }
            });

            content.appendChild(list);
            content.appendChild(addRow);
            content.appendChild(resetBtn);
        }

        function autoSave() {
            const c = cases[activeCaseIdx];
            saveCaseCC(c.id, workingCC[activeCaseIdx]);
            onSave(c.id, workingCC[activeCaseIdx]);
            saveNote.style.color = '#2ea44f';
            saveNote.textContent = '💾 Saved to Tampermonkey storage';
            setTimeout(() => saveNote.textContent = '', 2000);
        }

        renderTabs();
        renderContent();
        return panel;
    }

    // ─── MAIN DIALOG ──────────────────────────────────────────────────────────
    function createDialog() {
        let cases = getCases();

        const overlay  = mk('div', S.overlay);
        overlay.id     = 'sn-dialog-overlay';
        const dialog   = mk('div', S.dialog);
        const closeBtn = mk('button', S.closeBtn, '✕');
        closeBtn.addEventListener('click', () => overlay.remove());

        const title    = mk('h2', S.title,    '📦 SharkNinja Loading Summary');
        const subtitle = mk('p',  S.subtitle, `Select a case to auto-fill — ${DATE}`);
        const divider  = mk('hr', S.divider);
        const grid     = mk('div', S.grid);
        const statusEl = mk('div', S.status);
        const spacer   = mk('div', 'margin-top:14px;');

        const editToggleBtn = mk('button', S.editBtn, '⚙️ Edit CC Email Lists');
        let editorVisible   = false;
        let editorPanel     = null;

        function buildCaseButtons() {
            grid.innerHTML = '';
            cases.forEach(c => {
                const btn = mk('button', S.caseBtn(c.color), c.label);
                btn.addEventListener('mouseenter', () => btn.style.opacity = '0.85');
                btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
                btn.addEventListener('mousedown',  () => btn.style.transform = 'scale(0.97)');
                btn.addEventListener('mouseup',    () => btn.style.transform = 'scale(1)');
                btn.addEventListener('click', async () => {
                    grid.querySelectorAll('button').forEach(b => b.disabled = true);
                    editToggleBtn.disabled = true;
                    btn.textContent = '⏳ Filling...';
                    statusEl.style.color = '#555';

                    const ok = await fillForm(c, statusEl);

                    btn.textContent      = ok ? '✅ Done!' : '⚠️ Check fields';
                    btn.style.background = ok ? '#2ea44f' : '#dc3545';

                    setTimeout(() => {
                        grid.querySelectorAll('button').forEach(b => b.disabled = false);
                        editToggleBtn.disabled = false;
                        btn.textContent      = c.label;
                        btn.style.background = c.color;
                        statusEl.textContent = '';
                    }, 4000);
                });
                grid.appendChild(btn);
            });
        }

        buildCaseButtons();

        editToggleBtn.addEventListener('mouseenter', () =>
            editToggleBtn.style.background = '#e8e8e8');
        editToggleBtn.addEventListener('mouseleave', () =>
            editToggleBtn.style.background = '#f5f5f5');
        editToggleBtn.addEventListener('click', () => {
            editorVisible = !editorVisible;
            editToggleBtn.textContent = editorVisible
                ? '✕ Close Email Editor'
                : '⚙️ Edit CC Email Lists';
            if (editorVisible) {
                editorPanel = buildEditor(cases, (caseId, newCC) => {
                    const idx = cases.findIndex(c => c.id === caseId);
                    if (idx !== -1) cases[idx].cc = newCC;
                });
                dialog.appendChild(editorPanel);
            } else {
                if (editorPanel) { editorPanel.remove(); editorPanel = null; }
            }
        });

        const footer = mk('p', S.footer,
            '⚠️ Remember to attach the loading summary before sending.');
        const credit = mk('p', S.credit, 'Developed by @neelkml');

        // Assemble
        dialog.appendChild(closeBtn);
        dialog.appendChild(title);
        dialog.appendChild(subtitle);
        dialog.appendChild(divider);
        dialog.appendChild(grid);
        dialog.appendChild(statusEl);
        dialog.appendChild(spacer);
        dialog.appendChild(editToggleBtn);
        dialog.appendChild(footer);
        dialog.appendChild(credit);

        overlay.appendChild(dialog);
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
    }

    // ─── LAUNCHER BUTTON ─────────────────────────────────────────────────────
    function createLauncherButton() {
        if (document.getElementById('sn-launcher-btn')) return;
        const btn = mk('button', `
            position:fixed;top:12px;right:12px;z-index:99999;
            background:#232F3E;color:#FF9900;font-weight:bold;font-size:13px;
            padding:10px 16px;border:none;border-radius:6px;cursor:pointer;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:background 0.2s;
        `, '📦 SharkNinja Auto-Fill');
        btn.id = 'sn-launcher-btn';
        btn.addEventListener('mouseenter', () => btn.style.background = '#37475A');
        btn.addEventListener('mouseleave', () => btn.style.background = '#232F3E');
        btn.addEventListener('click', () => {
            const existing = document.getElementById('sn-dialog-overlay');
            if (existing) existing.remove();
            else createDialog();
        });
        document.body.appendChild(btn);
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────
    setTimeout(createLauncherButton, 2000);
    window.addEventListener('load', () => setTimeout(createLauncherButton, 2000));

})();
