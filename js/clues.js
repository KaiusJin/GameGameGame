/* 线索引擎（两个页面共用）：
   - 数据在 DB.CLUES（含 unlock 解锁条件），这里只做记录/查询/订阅
   - 发现即存 localStorage（xy_clues）；unlock 未满足的先挂起（xy_clues_pending），
     条件满足后自动转正并广播 */
(function () {
    var KEY = "xy_clues", PKEY = "xy_clues_pending";

    function read(k) {
        try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; }
    }
    var state = read(KEY);
    var pending = read(PKEY);
    var subs = [];

    function save() {
        localStorage.setItem(KEY, JSON.stringify(state));
        localStorage.setItem(PKEY, JSON.stringify(pending));
    }
    function def(id) {
        var list = (window.DB && DB.CLUES) || [];
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
    }
    function unlocked(d) {
        if (!d.unlock) return true;
        if (d.unlock.clue) return !!state[d.unlock.clue];
        return true;
    }
    function emit(id) {
        for (var i = 0; i < subs.length; i++) {
            try { subs[i](id); } catch (e) {}
        }
    }
    function found(id) {
        if (state[id]) return;
        var d = def(id);
        if (!d) return;
        if (!unlocked(d)) { pending[id] = 1; save(); return; }
        state[id] = Date.now();
        delete pending[id];
        save();
        emit(id);
        /* 解锁条件刚满足的挂起线索转正 */
        Object.keys(pending).forEach(function (p) {
            var pd = def(p);
            if (pd && unlocked(pd)) { delete pending[p]; save(); found(p); }
        });
    }
    window.CLUE = {
        found: found,
        has: function (id) { return !!state[id]; },
        onFound: function (fn) { subs.push(fn); },
        count: function () { return Object.keys(state).length; }
    };
})();
