/**
 * @local/dsh-claim-discipline
 *
 * Does exactly one thing: inject a standing "claim discipline" section into the
 * system prompt.
 *
 * The rules were not invented. They are ordered by the observed frequency of
 * failure in one real session, audited turn by turn on 2026-10-17 (30 instances
 * across 12 patterns): unverified attribution 9, untraceable numbers 5,
 * "verified" claimed for something else 3, mislabelled path/target 3,
 * conclusion bigger than the evidence 2, own output already held the
 * counter-example 2, completeness overclaimed 2, hypothesis silently dropped 1.
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
  '7. 先怀疑仪器再怀疑环境。多个目标连"本该成功的对照"一起失败时先查探针；实验必须带一个必通对照和一个必不通对照。报路径/标签前先打印真实值。'
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