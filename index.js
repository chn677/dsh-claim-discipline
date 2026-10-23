/**
 * @local/dsh-claim-discipline
 *
 * Does exactly one thing: inject a standing "claim discipline" section into the
 * system prompt.
 *
 * Rules 1-7 are ordered by the observed frequency of failure in one real session,
 * audited turn by turn on 2026-10-17 (30 instances across 12 patterns):
 * unverified attribution 9, untraceable numbers 5,
 * "verified" claimed for something else 3, mislabelled path/target 3,
 * conclusion bigger than the evidence 2, own output already held the
 * counter-example 2, completeness overclaimed 2, hypothesis silently dropped 1.
 *
 * Rule 8 and the meta-case block were added on 2026-10-23, after two same-pattern
 * failures in one evening: a log line and a code comment were both quoted as
 * behaviour evidence, while the running code did not read that field at all.
 *
 * Design constraints (why it looks like this):
 *   - Zero imports: no module-resolution failure surface.
 *   - Zero peerDependencies: DSH compares declared peers against the runtime
 *     version, so declaring none imposes no constraint and this plugin is never
 *     silently skipped after a DSH upgrade (@local/wincu-node-env does the same).
 *   - Zero callbacks: no session/event, turn-stopping or timer handler. Per the
 *     dsh-app-boot startup-failure table, an uncaught exception in a synchronous
 *     callback is FATAL - it releases the app and exits non-zero. This plugin
 *     therefore has no ability to "execute"; its worst case is not taking effect.
 */
export const name = 'claim-discipline';

/** Depends on the systemPrompt service; the row stays inactive when it is missing rather than throwing. */
export const inject = ['systemPrompt'];

/** The section name must be unique within its layer (duplicates throw). The local: prefix avoids reserved names. */
const SECTION_NAME = 'local:claim-discipline';

/** External contributions may use any finite order; 10300 places it after the persona suffix (10200). */
const SECTION_ORDER = 10300;

/**
 * The injected payload. Intentionally Chinese: these are instructions for an
 * agent that replies in Chinese, so the wording must match the language of the
 * conversation. README.md carries an English gloss of all seven rules.
 */
const TEXT = [
  '【断言纪律】下结论前逐条自查（规则按本机实测出错频率排序）：',
  '1. 归因先摆证据。写"说明/真因是/是X导致的/因果成立"之前，上一句必须是一条本轮的直接观测；没有就降级为「疑似，未验证」。不同时刻读取的值不得拼成一个状态。',
  '2. 数字当场可溯。报数量要附原始值（如 3887.4 MB）；集合数字必须由同表逐行相加并写出加式；禁止跨时刻相减；MB→GB 一律 /1024。',
  '3. 结论不许比证据大。结论句里不得出现证据中没有的维度词（都/所有/只有/任何/全部/境外）；出现这类词就逐行点数核对。',
  '4. 说"已验证"必须指出判据。要能指出"输出里的哪一行"证明了它，指不出就写「未验证」。自述（"我只读了没写"）不算证据，只能标注为自述。',
  '5. 没验证就不许宣称完成。说"已修好/已生效"之前，本轮必须真的跑过那条验证，并读过完整输出与退出码。',
  '6. 假设必须收口。写了"可能是…我查一下"就必须给出结论句（包括"假设被否"）；宣布过的步骤若不做，显式划掉，不许静默消失。',
  '7. 先怀疑仪器再怀疑环境。多个目标连"本该成功的对照"一起失败时先查探针；实验必须带一个必通对照和一个必不通对照。报路径/标签前先打印真实值。',
  '8. 说明不是行为。注释、日志文案、README、界面提示、以及软件自己打的"请去某处设置"，都只算「有人这么写」，不算行为证据。要断言某个开关/字段"生效/钉死/已改变行为"，必须先读实现里真正读它的那一行（grep 该字段，逐处分类：schema / 默认值 / 写入钳制 / 日志门 / 真实分支），并给出改值前后各一次可观测输出的对比；若它只出现在文案里，结论只能写「目前只影响提示文字」。',
  '',
  '【元认知·自省案例 2026-10-23】把「描述」当成「观察」是本机最高频的幻觉形态，两次同类实例：① 插件日志写「请在高级里填『只回谁的私信』」→ 我转述成事实，而前端代码里该字段出现 0 次、界面根本没有这个输入框；② 代码注释写「判据顺序：显式 UID → …」→ 我据此断言「写入该字段已把行为钉死」，实际那个函数先返回 dmUid、根本不读它，唯一真实效果是一行日志不再出现。共同点：手上只有「文本层的一段说明」，却给出了「运行时已改变」的结论。修法固定为三步：把说明降级为线索 → 去读真正读它的分支 → 改值前后各取一次可观测输出；做不到就只写「只影响提示文字」。'
].join('\n');

/**
 * Register the standing prompt section.
 * The call shape follows the live dsh-persona/lib/index.js:36-41.
 * @param ctx - the plugin context.
 */
function apply(ctx) {
  ctx.effect(() => ctx.systemPrompt.section({
    name: SECTION_NAME,
    order: SECTION_ORDER,
    text: TEXT
  }), 'claim-discipline.section()');
}

export { apply };