# test 全量执行与上一版对照 · 2026-11-09 10:33

本轮仅重跑test全量172条：实际发问153条，未执行17条，延期2条未做任何准备或请求。通过84、失败69、待复核0。失败中63条是服务生成失败（63条已由精确请求Trace确认模型额度用尽、返回429），6条是实际回答问题。已确认服务异常的只读用例按规则最多重跑一次（本轮64条）；保留全部尝试。与上一版test逐例对照，状态下降不能直接当作业务能力回退。拉取本地test代码不代表服务已部署该提交。

上一版41条失败中，本轮27条通过，5条仍有回答问题，9条被生成服务故障挡住，尚不能确认原问题是否修好。上一版通过的用例中，有54条本轮因生成服务故障失败；新出现的回答问题1条。

本轮通过只代表本次当前事实下回答通过；服务失败的旧问题无法据本轮确认修好或未修。没有部署版本或严格可比证据时，不把变化归因于本地刚拉取的提交。

[上一版主报告与历史复核](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261107-1100-history-expansion-test-pre-messages/cloud-review/current/)

| 状态 | 上一版 | 本轮 |
|---|---:|---:|
| 通过 | 112 | 84 |
| 失败 | 41 | 69 |
| 待复核 | 0 | 0 |
| 未执行 | 17 | 17 |
| 延期 | 2 | 2 |

状态变化是两份报告的结果对照。生成服务故障、实时数据变化、裁判或证据口径变化不直接等于产品能力回退。严格可比项另见每例execution_comparison。

| 用例 | 追问人 | 上一版 | 本轮 | 本轮原因 |
|---|---|---|---|---|
| [AA-QAP-001](./cloud-review/current/#failure-test-AA-QAP-001) | 智本_anrou | 通过 | 通过 | 回答命中“客户权限安全审计整改”任务，正确说明当前负责人为 anrou17。追问前的认证业务回读与本轮任务详情一致，满足用户所问。 |
| [AA-QAP-002](./cloud-review/current/#failure-test-AA-QAP-002) | 智本_anrou | 通过 | 通过 | 回答明确说明任务尚未完成、系统状态为进行中，并依据最新评论说明已进入开发中、内审尚未开始。任务详情和完整评论记录支持这些结论，且提供了可定位的任务来源。 |
| [AA-QAP-003](./cloud-review/current/#failure-test-AA-QAP-003) | 智本_anrou | 通过 | 通过 | 回答正确说明还有2个必修问题未完成，并分别交代窗口恢复异常的框架依赖、多空间切换闪屏的开发进展及后续验证计划。以本轮2026年11月9日为时间依据，将9月历史排期与当前承诺区分，明确无法确认全部解决时间及群聊、汇报证据的覆盖限制。 |
| [AA-QAP-018](./cloud-review/current/#failure-test-AA-QAP-018) | CEO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-QAP-022](./cloud-review/current/#failure-test-AA-QAP-022) | CFO | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-QAP-023](./cloud-review/current/#failure-test-AA-QAP-023) | 智本_anrou | 通过 | 通过 | 回答明确说明当前可访问项目范围内未找到匹配项目，无法确认进展，并建议补充项目链接、所在空间或准确名称。检索返回无结果，回答没有编造进展，也没有将旧版 CRM 迁移冒充目标项目。 |
| [AA-QAP-024](./cloud-review/current/#failure-test-AA-QAP-024) | CEO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-QAP-027](./cloud-review/current/#failure-test-AA-QAP-027) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-QAP-028](./cloud-review/current/#failure-test-AA-QAP-028) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-001](./cloud-review/current/#failure-test-AA-FU-001) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-002](./cloud-review/current/#failure-test-AA-FU-002) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-003](./cloud-review/current/#failure-test-AA-FU-003) | CFO | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-004](./cloud-review/current/#failure-test-AA-FU-004) | Auto_Hod | 通过 | 失败 | 用户只问本部门和下级部门的AI项目，回答却混入公司公共项目和其他部门项目，把范围扩大到了25个。 |
| [AA-FU-005](./cloud-review/current/#failure-test-AA-FU-005) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-006](./cloud-review/current/#failure-test-AA-FU-006) | CFO | 通过 | 通过 | 本轮是已核实的空历史新会话，用户未给出两个项目的名称或引用，无法确定“这两个”的具体指代。助手请求补充名称以便核实，且将查询结论限定为名称含“AI评测”的已查项目，没有断言所有可见项目都不存在语义检索专项。 |
| [AA-FU-007](./cloud-review/current/#failure-test-AA-FU-007) | CFO | 通过 | 通过 | 回答命中了知识召回质量治理、向量索引召回实验两个直接匹配项目，名称、引用定位和业务描述均与本轮回读一致。回答说明按项目描述判断，并以编号列出直接匹配项，另外补充两个语义相关项目，没有将项目规划描述说成已完成成果。 |
| [AA-FU-008](./cloud-review/current/#failure-test-AA-FU-008) | CFO | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-009](./cloud-review/current/#failure-test-AA-FU-009) | CFO | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-010](./cloud-review/current/#failure-test-AA-FU-010) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-011](./cloud-review/current/#failure-test-AA-FU-011) | 智本_anrou | 通过 | 通过 | 回答将“安全审计”定位为“客户权限安全审计整改”，正确给出了当前执行人 anrou17 和所属项目“治理与安全整改”。本轮任务详情及项目查询支持这些信息，且回答提供了可定位的来源引用。 |
| [AA-FU-012](./cloud-review/current/#failure-test-AA-FU-012) | 智本_anrou | 延期 | 延期 | 细节问题 |
| [AA-FU-013](./cloud-review/current/#failure-test-AA-FU-013) | 智本_anrou | 通过 | 通过 | 回答逐项列出了窗口恢复异常、多空间切换闪屏两项未完成必修问题，计划、状态和原期限均与任务详情一致，并正确排除了已完成的菜单焦点丢失。以本轮2026年11月9日追问时间为界，回答明确把9月排期标为历史计划，说明最新进展的核验缺口，没有编造完成或上线日期。 |
| [AA-FU-014](./cloud-review/current/#failure-test-AA-FU-014) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-015](./cloud-review/current/#failure-test-AA-FU-015) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-016](./cloud-review/current/#failure-test-AA-FU-016) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-017](./cloud-review/current/#failure-test-AA-FU-017) | 智本_anrou | 通过 | 通过 | 回答正确给出指定任务的最新负责人智本_anrou，以及东京时间2026年11月9日11:04:28的变更时间。负责人增删日志、当前任务详情和任务引用一致，变更发生在提问前约2秒，符合最近5分钟的要求。 |
| [AA-FU-019](./cloud-review/current/#failure-test-AA-FU-019) | 智本_anrou | 失败 | 通过 | 回答正确列出两项临期高优先级未完成任务，状态、东京时间截止时间和引用均与本轮源数据一致，且未纳入四项负向样本。实际问题未明确连续七天边界，回答已说明采用的自然日范围，没有证据证明该口径造成漏答，不能仅据此判失败。 |
| [AA-FU-030](./cloud-review/current/#failure-test-AA-FU-030) | 智本_anrou | 通过 | 通过 | 本轮是已核验的空历史新会话，没有绑定项目，用户也未提供项目名称，“这个项目”无法确定指代。助手请求补充或选择项目，属于合理澄清，不应因未返回项目状态和任务明细判失败。 |
| [AA-FU-034](./cloud-review/current/#failure-test-AA-FU-034) | 智本_anrou | 失败 | 失败 | 找到了高优先级逾期项目，但没有完整查清卡点。例如“Gamma 支付升级”已有白名单审批依赖的来源，回答仍说待核实。 |
| [AA-FU-037](./cloud-review/current/#failure-test-AA-FU-037) | CEO | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-039](./cloud-review/current/#failure-test-AA-FU-039) | 智本_anrou | 通过 | 通过 | 回答正确区分了等待本人确认方案A发布的任务，以及仅同步构建进度、无需本人审批或拍板的任务。分类依据任务说明和最新评论，数量、进行中及系统逾期状态均与当轮证据一致。 |
| [AA-FU-040](./cloud-review/current/#failure-test-AA-FU-040) | 智本_anrou | 通过 | 通过 | 回答依据当轮项目、任务、评论及操作日志，按时间顺序说明了9月15日的建立与启动，以及9月17日两条评论所述的阶段推进。它将指定历史区间与11月9日追问时的当前状态分开，并明确评论日期不等于阶段实际发生日期、未查到其他变化仅限已查范围。 |
| [AA-FU-041](./cloud-review/current/#failure-test-AA-FU-041) | 自动化_Anna2 | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-042](./cloud-review/current/#failure-test-AA-FU-042) | CFO | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-043](./cloud-review/current/#failure-test-AA-FU-043) | 自动化_Anna3 | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-044](./cloud-review/current/#failure-test-AA-FU-044) | 自动化_Anna2 | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-045](./cloud-review/current/#failure-test-AA-FU-045) | Auto_Hod | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-046](./cloud-review/current/#failure-test-AA-FU-046) | CEO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-047](./cloud-review/current/#failure-test-AA-FU-047) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-048](./cloud-review/current/#failure-test-AA-FU-048) | 自动化_Anna2 | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-049](./cloud-review/current/#failure-test-AA-FU-049) | 自动化_Anna6 | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-050](./cloud-review/current/#failure-test-AA-FU-050) | 自动化_Anna2 | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-051](./cloud-review/current/#failure-test-AA-FU-051) | Auto_Hod | 通过 | 通过 | 回答明确说明临时加入其他部门不会自动获得该部门全部项目权限，并以空间、项目的实际权限和当前可见范围作为判断依据。用户仅询问权限原则，回答未声称已核验具体授权，也未披露受限项目内容。 |
| [AA-FU-056](./cloud-review/current/#failure-test-AA-FU-056) | CFO | 通过 | 通过 | 追问前以真实 CFO 身份独立回读的项目清单中，没有名称匹配北极星迁移的项目，当轮项目解析也返回未找到。回答明确限定当前可访问范围并请求提供链接或其他名称，没有编造进展，也没有断言全系统不存在。 |
| [AA-FU-057](./cloud-review/current/#failure-test-AA-FU-057) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-058](./cloud-review/current/#failure-test-AA-FU-058) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-060](./cloud-review/current/#failure-test-AA-FU-060) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-061](./cloud-review/current/#failure-test-AA-FU-061) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-063](./cloud-review/current/#failure-test-AA-FU-063) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-FU-067](./cloud-review/current/#failure-test-AA-FU-067) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-SMEM-002](./cloud-review/current/#failure-test-AA-SMEM-002) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-SMEM-003](./cloud-review/current/#failure-test-AA-SMEM-003) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-SMEM-004](./cloud-review/current/#failure-test-AA-SMEM-004) | 智本_anrou | 通过 | 通过 | 首轮准确概述 X 项目的暂停状态及外部鉴权联调受回调域名开放依赖阻塞，并说明9月记录不能直接证明11月追问时依赖仍未解除。次轮继承两项风险和来源，按潜在影响排序，明确属于相对判断而非系统评级。 |
| [AA-SMEM-005](./cloud-review/current/#failure-test-AA-SMEM-005) | CFO | 失败 | 失败 | 首次因模型额度用尽返回429，未能回答。重跑准备时，接口仍返回原项目会话，无法确认是新空会话，所以没有发送第二次问题。保留首次失败和重跑受阻证据。 |
| [AA-SMEM-006](./cloud-review/current/#failure-test-AA-SMEM-006) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-SMEM-007](./cloud-review/current/#failure-test-AA-SMEM-007) | CFO | 通过 | 通过 | 前两轮分别正确列出了项目执行人专项和项目管理员专项，项目引用与查询结果一致。末轮正确将“第一个项目”回指首轮的项目执行人专项，并准确回答创建人为当前用户 CFO。 |
| [AA-SMEM-008](./cloud-review/current/#failure-test-AA-SMEM-008) | 智本_anrou | 通过 | 通过 | 首轮准确说明任务系统状态为进行中，并将9月15日的历史评论与追问时的实际进展区分，没有把旧计划认定为已完成。第二轮正确回指首轮评论，作者CFO及东京时间19:53均与工具原始记录一致。 |
| [AA-SMEM-009](./cloud-review/current/#failure-test-AA-SMEM-009) | 智本_anrou | 通过 | 通过 | 三轮均保持本周（2026年11月9日至15日）的明确查询口径，当前证据支持结果为空。后续正确保留高优先级条件，并说明无对应推进执行人，未混入其他租户的历史参考项目。 |
| [AA-SMEM-011](./cloud-review/current/#failure-test-AA-SMEM-011) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-SMEM-012](./cloud-review/current/#failure-test-AA-SMEM-012) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-SMEM-013](./cloud-review/current/#failure-test-AA-SMEM-013) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-SMEM-014](./cloud-review/current/#failure-test-AA-SMEM-014) | CFO | 未执行 | 未执行 | 缺少可验证的上下文压缩控制和压缩结果回读能力，无法证明长会话压缩场景成立，本轮未发送问题。 |
| [AA-SMEM-015](./cloud-review/current/#failure-test-AA-SMEM-015) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已核对原请求，保留失败证据。 |
| [AA-SMEM-016](./cloud-review/current/#failure-test-AA-SMEM-016) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已核对原请求，保留失败证据。 |
| [AA-AGENT-EVAL-006](./cloud-review/current/#failure-test-AA-AGENT-EVAL-006) | CFO | 未执行 | 未执行 | 缺少已验证的test目标群消息和“首个空页但仍有下一页”的受控分页回执，无法检验该场景，本轮未发送问题。 |
| [AA-AGENT-EVAL-011](./cloud-review/current/#failure-test-AA-AGENT-EVAL-011) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-AGENT-EVAL-012](./cloud-review/current/#failure-test-AA-AGENT-EVAL-012) | CFO | 未执行 | 未执行 | 缺少SRE提供的本轮隔离429故障注入及复位回执，无法验证真实重试行为，本轮未发送问题。 |
| [AA-AGENT-EVAL-013](./cloud-review/current/#failure-test-AA-AGENT-EVAL-013) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-AGENT-EVAL-014](./cloud-review/current/#failure-test-AA-AGENT-EVAL-014) | CFO | 未执行 | 未执行 | 缺少真实30步执行链及第12步503故障注入、恢复回执，无法检验该场景，本轮未发送问题。 |
| [AA-PROG-001](./cloud-review/current/#failure-test-AA-PROG-001) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-002](./cloud-review/current/#failure-test-AA-PROG-002) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-003](./cloud-review/current/#failure-test-AA-PROG-003) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-004](./cloud-review/current/#failure-test-AA-PROG-004) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-005](./cloud-review/current/#failure-test-AA-PROG-005) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-006](./cloud-review/current/#failure-test-AA-PROG-006) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-007](./cloud-review/current/#failure-test-AA-PROG-007) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-008](./cloud-review/current/#failure-test-AA-PROG-008) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-009](./cloud-review/current/#failure-test-AA-PROG-009) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-010](./cloud-review/current/#failure-test-AA-PROG-010) | CFO | 通过 | 通过 | 回答准确说明10月8日前完成首轮验证只是争取目标，不能确认为完成承诺，并说明样本仍在收集、开始和完成时间未确认。工具已成功回读目标任务评论，足以支持本题的完成时间结论。 |
| [AA-PROG-011](./cloud-review/current/#failure-test-AA-PROG-011) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-PROG-012](./cloud-review/current/#failure-test-AA-PROG-012) | CFO | 通过 | 通过 | 首轮正确说明了指定10月5日批次的已完成事项、修订排期、重复记录和核对依赖风险，并核实项目状态及关联项目群。次轮承接同一项目合理排序风险、解释影响并提出后续建议，没有把计划或建议当作已执行结果。 |
| [AA-FU-069](./cloud-review/current/#failure-test-AA-FU-069) | CEO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-AUTO-TEST-001](./cloud-review/current/#failure-test-AA-AUTO-TEST-001) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-002](./cloud-review/current/#failure-test-AA-AUTO-TEST-002) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-003](./cloud-review/current/#failure-test-AA-AUTO-TEST-003) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-004](./cloud-review/current/#failure-test-AA-AUTO-TEST-004) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-005](./cloud-review/current/#failure-test-AA-AUTO-TEST-005) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-006](./cloud-review/current/#failure-test-AA-AUTO-TEST-006) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-007](./cloud-review/current/#failure-test-AA-AUTO-TEST-007) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-008](./cloud-review/current/#failure-test-AA-AUTO-TEST-008) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-009](./cloud-review/current/#failure-test-AA-AUTO-TEST-009) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-010](./cloud-review/current/#failure-test-AA-AUTO-TEST-010) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-011](./cloud-review/current/#failure-test-AA-AUTO-TEST-011) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-012](./cloud-review/current/#failure-test-AA-AUTO-TEST-012) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-AUTO-TEST-013](./cloud-review/current/#failure-test-AA-AUTO-TEST-013) | CFO | 未执行 | 未执行 | CFO账号已有20个自动化任务，达到上限。本轮未创建或触发自动化，需先释放该账号名额。 |
| [AA-SMEM-017](./cloud-review/current/#failure-test-AA-SMEM-017) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已核对原请求，保留失败证据。 |
| [AA-SMEM-018](./cloud-review/current/#failure-test-AA-SMEM-018) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已核对原请求，保留失败证据。 |
| [AA-SMEM-019](./cloud-review/current/#failure-test-AA-SMEM-019) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已核对原请求，保留失败证据。 |
| [AA-SMEM-020](./cloud-review/current/#failure-test-AA-SMEM-020) | CFO | 失败 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已核对原请求，保留失败证据。 |
| [AA-SMEM-021](./cloud-review/current/#failure-test-AA-SMEM-021) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已核对原请求，保留失败证据。 |
| [AA-SMEM-022](./cloud-review/current/#failure-test-AA-SMEM-022) | CFO | 通过 | 通过 | 首轮按名称升序列出本轮3项任务，负责人引用和当前状态均与当轮快照一致。追问正确确认同名乙为待启动的新任务，并依据不同标识及删除日志区分了新旧对象。 |
| [AA-AGG-TEST-001](./cloud-review/current/#failure-test-AA-AGG-TEST-001) | 智本_anrou | 失败 | 通过 | 回答正确限定了指定空间的三个项目，排除了默认项目及其他对象。主任务32个、子孙任务32个、全部去重64个，与本轮完整回读及工具统计一致，项目引用也可定位。 |
| [AA-AGG-TEST-002](./cloud-review/current/#failure-test-AA-AGG-TEST-002) | 智本_anrou | 通过 | 通过 | 回答给出任务总数63项、主任务31项、所有层级子任务32项，与追问前当前账号的完整任务树回读一致。统计限定于指定项目，且引用定位正确，没有把主任务数量当作全树总数。 |
| [AA-AGG-TEST-003](./cloud-review/current/#failure-test-AA-AGG-TEST-003) | 智本_anrou | 失败 | 通过 | 回答正确给出31个直接子任务，并明确排除孙任务。任务引用与本轮解析对象一致，数量也与追问前同身份完整回读及当轮子任务查询的total一致。 |
| [AA-AGG-TEST-004](./cloud-review/current/#failure-test-AA-AGG-TEST-004) | 智本_anrou | 失败 | 通过 | 回答正确给出不含任务本身的32个后代，其中直接子任务31个、孙任务1个，更深层级0个。统计与追问前同一账号的完整递归回读一致，并提供了可定位的主任务引用。 |
| [AA-AGG-TEST-005](./cloud-review/current/#failure-test-AA-AGG-TEST-005) | 智本_anrou | 失败 | 通过 | 回答正确限定三个指定项目，并按主任务和全部子孙任务的自身状态分别统计。结果与本轮追问前的完整递归回源及当轮工具统计一致，旧Gold多出的未开始主任务已不在当前任务树中。 |
| [AA-AGG-TEST-006](./cloud-review/current/#failure-test-AA-AGG-TEST-006) | 智本_anrou | 失败 | 通过 | 回答正确限定了指定空间中的三个项目，给出高优先级且未完成的主任务10项、子孙任务11项。结果与本轮追问前的完整业务树回读一致，引用项目也可定位，未将仅承接孙任务的中优先级父节点重复计入。 |
| [AA-AGG-TEST-007](./cloud-review/current/#failure-test-AA-AGG-TEST-007) | 智本_anrou | 失败 | 通过 | 回答正确限定三个指定项目并包含全部层级，创建人数量降序为23、21、20，共64项。各状态统计与追问前的当轮业务源全树回读一致，智本_Anna当前为6项进行中、8项已完成，不应套用旧Gold的7/7。 |
| [AA-AGG-TEST-008](./cloud-review/current/#failure-test-AA-AGG-TEST-008) | 智本_anrou | 失败 | 通过 | 回答按指定三个项目统计主任务及各级子任务，项目甲三位创建人的数量为23、21、19，项目乙为1，均与本轮回源一致。空项目单独说明无任务、无创建人分组，且明确排除了默认项目和其他对象。 |
| [AA-AGG-TEST-009](./cloud-review/current/#failure-test-AA-AGG-TEST-009) | 智本_anrou | 失败 | 通过 | 回答仅统计指定的三个项目，五项计数均与本轮当前身份的完整任务树回读一致。项目甲已完成21、逾期17，应采用追问前的当前事实，不能用旧Gold的20和5覆盖。 |
| [AA-AGG-TEST-010](./cloud-review/current/#failure-test-AA-AGG-TEST-010) | 智本_anrou | 通过 | 通过 | 回答给出项目甲3人、项目乙1人、空项目0人，与本轮追问前的完整任务树回读一致。统计限定指定三个项目，说明包含主任务和子任务、按执行人去重，并提供了可定位的项目引用。 |
| [AA-AGG-TEST-011](./cloud-review/current/#failure-test-AA-AGG-TEST-011) | 智本_anrou | 通过 | 通过 | 回答给出主任务0项、子孙任务23项，与追问前当前账号完整任务树回读及本轮统计结果一致。筛选限定于指定三个项目和智本_Anna7创建的任务，明确排除了展示路径父任务、空间默认项目及其他对象，引用可定位。 |
| [AA-AGG-TEST-012](./cloud-review/current/#failure-test-AA-AGG-TEST-012) | 智本_anrou | 通过 | 通过 | 回答正确给出有1个项目满足条件，即聚合验收项目甲，并明确包含各级子任务、每个项目只计一次及排除其他对象。追问前的当前身份全树回读确认甲存在逾期任务，乙无逾期任务，空项目无任务，项目引用定位准确。 |
| [AA-AGG-TEST-013](./cloud-review/current/#failure-test-AA-AGG-TEST-013) | 智本_anrou | 失败 | 通过 | 回答正确限定三个指定项目及全部层级，列出智本_Anna7创建23条、智本_anrou创建21条。严格排除了创建20条的人员，统计总量64条与本轮回源证据一致。 |
| [AA-AGG-TEST-014](./cloud-review/current/#failure-test-AA-AGG-TEST-014) | 智本_anrou | 失败 | 通过 | 回答仅统计指定三个项目，正确返回创建任务数为23、21、20条的三位人员，并包含恰好20条的人员。64条任务及主任务、子任务各32条的口径与本轮完整回读一致，项目引用可追溯。 |
| [AA-AGG-TEST-015](./cloud-review/current/#failure-test-AA-AGG-TEST-015) | 智本_anrou | 失败 | 通过 | 回答正确限定三个指定项目及全部任务层级，创建数量前两名和各状态数量均与本轮回源证据一致。包含第三级任务064，64条总数及项目引用也可核验。 |
| [AA-AGG-TEST-016](./cloud-review/current/#failure-test-AA-AGG-TEST-016) | 智本_anrou | 失败 | 通过 | 回答正确限定了三个指定项目及全部层级，按东京日期给出10月20日13项、10月30日39项和未设置截止时间12项。结果与追问前当前账号的完整业务回读一致，三个项目引用也可定位。 |
| [AA-AGG-TEST-017](./cloud-review/current/#failure-test-AA-AGG-TEST-017) | 智本_anrou | 通过 | 通过 | 回答正确给出31个直接子任务、32个主任务，平均为0.96875个，约0.97个。统计仅限三个指定项目，纳入无子任务的主任务、排除孙任务，并提供可定位引用。 |
| [AA-AGG-TEST-018](./cloud-review/current/#failure-test-AA-AGG-TEST-018) | 智本_anrou | 通过 | 通过 | 回答限定了指定空间的三个项目，正确给出任务001直接子任务最多为31个，最少为0个且31个主任务并列。统计口径和可定位引用与追问前当前账号的完整业务回读一致。 |
| [AA-AGG-TEST-019](./cloud-review/current/#failure-test-AA-AGG-TEST-019) | 智本_anrou | 通过 | 通过 | 两轮分别正确回答创建或执行的并集37个、创建且执行的交集9个，角色重合未重复计数。项目引用与指定范围一致，第二轮也正确说明9个均为主任务。 |
| [AA-AGG-TEST-020](./cloud-review/current/#failure-test-AA-AGG-TEST-020) | 智本_anrou | 通过 | 通过 | 三轮均保持指定空间内三个项目的范围，正确回答主任务32个、包含全部层级子任务64个、仅子孙任务32个。项目分布及可定位引用与各轮追问前的认证业务回读一致。 |
| [AA-AGG-TEST-021](./cloud-review/current/#failure-test-AA-AGG-TEST-021) | 智本_anrou | 通过 | 通过 | 回答正确给出指定项目主任务、子任务均为0，并将完成率和平均子任务数标为不适用，说明了零分母原因。统计范围和项目引用与本轮当前身份回读一致，未混入其他项目。 |
| [AA-AGG-TEST-022](./cloud-review/current/#failure-test-AA-AGG-TEST-022) | 智本_anrou | 通过 | 通过 | 回答按指定三个项目分别给出主任务和全层级完成率及分子分母，与本轮追问前的独立全树回读一致。空项目正确标为不适用，未混入默认项目；历史Gold的旧完成数量不覆盖本轮事实。 |
| [AA-AGG-TEST-023](./cloud-review/current/#failure-test-AA-AGG-TEST-023) | 智本_anrou | 失败 | 通过 | 回答仅统计指定三个项目，给出64个唯一任务和70条任务执行人关系，与本轮追问前的完整全树回读一致。已说明包含主任务及子任务，并明确多人执行不会重复计为多条任务，项目引用也可定位。 |
| [AA-AGG-TEST-024](./cloud-review/current/#failure-test-AA-AGG-TEST-024) | 智本_anrou | 失败 | 通过 | 回答正确限定了指定空间的三个项目，并分别给出主任务和全部子孙任务的未设置截止时间数及逾期数，与本轮回源数据一致。未排期任务未被计入逾期，旧Gold中的逾期数量不适用于本轮快照。 |
| [AA-MULTI-TEST-001](./cloud-review/current/#failure-test-AA-MULTI-TEST-001) | 智本_anrou | 失败 | 通过 | 回答正确限定了所选两个项目，包含主任务和全部子孙任务，共64项，并按创建数量23、21、20降序展示。各创建人的状态统计与追问前的最新业务回读一致；Anna创建的任务031已于10月24日完成，不能沿用旧Gold中的状态数量。 |
| [AA-MULTI-TEST-002](./cloud-review/current/#failure-test-AA-MULTI-TEST-002) | 智本_anrou | 失败 | 通过 | 三轮均正确保持了指定项目与全层级统计口径：项目甲63项、项目乙1项，创建人分组为23、21、19项，恢复两个项目后的总数为64项。回答中的项目及人员引用可定位，与本次逐轮业务源和工具结果一致。 |
| [AA-MULTI-TEST-003](./cloud-review/current/#failure-test-AA-MULTI-TEST-003) | 智本_anrou | 通过 | 通过 | 回答仅比较选中的三条任务，创建人、负责人和状态均与本轮独立回源一致，已完成2条、未完成1条的统计正确。任务001的逾期标记有追问前的当前数据支持，不能用旧Gold中的逾期0覆盖。 |
| [AA-MULTI-TEST-004](./cloud-review/current/#failure-test-AA-MULTI-TEST-004) | 智本_anrou | 失败 | 通过 | 回答给出33条不同任务，并正确说明任务033、064均包含在任务001的任务树内，重叠部分只计一次。结果与追问前当前账号完整回源及本轮工具统计一致，引用也能定位所选任务。 |
| [AA-MULTI-TEST-005](./cloud-review/current/#failure-test-AA-MULTI-TEST-005) | 智本_anrou | 通过 | 通过 | 三轮正确维护了选中集合：先计2条，加入任务032后计3条，移除任务001后剩2条，均未计入子任务。首轮比较与业务回读一致，末轮“均已完成”也与当轮状态证据一致，等价表达了未开始和进行中均为0。 |
| [AA-MULTI-TEST-006](./cloud-review/current/#failure-test-AA-MULTI-TEST-006) | 智本_anrou | 通过 | 通过 | 回答正确列明任务001、002属于聚合验收项目甲，任务032属于聚合验收项目乙，按项目计数为2条和1条。明确只统计所选三条任务且不展开子任务，任务和项目引用均可定位。 |
| [AA-MULTI-TEST-007](./cloud-review/current/#failure-test-AA-MULTI-TEST-007) | 智本_anrou | 通过 | 通过 | 两轮均正确统计所选项目甲、乙的所有层级任务，合计64项，分项目为63项和1项。第二轮仅调整展示顺序，没有改变对象集合、层级口径或引用归属。 |
| [AA-MULTI-TEST-008](./cloud-review/current/#failure-test-AA-MULTI-TEST-008) | 智本_anrou | 通过 | 通过 | 回答正确将重复卡片去重为两个所选项目，统计全部主子任务共64项。项目甲63项、项目乙1项，以及主任务32项、子任务32项，均与追问前的完整业务源回读一致。 |
| [AA-MULTI-TEST-009](./cloud-review/current/#failure-test-AA-MULTI-TEST-009) | 智本_anrou | 通过 | 通过 | 回答分别列出了所选两个项目全部层级的任务总数和完成率，并正确将空项目完成率标为不适用。本轮独立回读支持项目甲共63项、完成21项，33.3%正确，旧Gold的20项不适用于本轮。 |
| [AA-MULTI-TEST-010](./cloud-review/current/#failure-test-AA-MULTI-TEST-010) | 智本_anrou | 通过 | 通过 | 助手按实际选中的两个对象回源，正确识别任务001为进行中、任务032为已完成，没有被旧卡片标题误导。回答仅涵盖选中对象，未展开后代，并提供了可追溯的任务引用。 |
| [AA-MULTI-TEST-011](./cloud-review/current/#failure-test-AA-MULTI-TEST-011) | 智本_anrou | 通过 | 通过 | 回答仅统计三条选中任务，创建人与当前状态的分组数量均与本轮业务源回读一致，没有将展示用的未选中父任务计入。“待启动”与“未开始”语义等价，省略零数量分组不影响结果。 |
| [AA-MULTI-TEST-012](./cloud-review/current/#failure-test-AA-MULTI-TEST-012) | 智本_anrou | 通过 | 通过 | 回答正确按项目分别统计：甲为31个主任务、32个子孙任务、共63个，乙为1个主任务、0个子孙任务、共1个。明确子孙任务包含各级子任务，且未混入空项目，项目引用可定位。 |
| [AA-MULTI-TEST-013](./cloud-review/current/#failure-test-AA-MULTI-TEST-013) | 智本_anrou | 失败 | 通过 | 回答按创建任务总数降序列出了全部创建人，并分别给出主任务和全部层级子任务的状态数量，与本轮追问前的独立全树回读一致。主任务仅计顶层、子任务按自身创建人及状态统计且不重复计入主任务，口径说明清楚。 |
| [AA-REAL-TEST-001](./cloud-review/current/#failure-test-AA-REAL-TEST-001) | 智本_anrou | 失败 | 通过 | 回答完整列出了当前账号在项目甲负责的23项未完成任务，并正确说明项目乙无符合任务，引用可追溯。按本轮东京时间识别17项已过截止时间的任务，区分了系统逾期标记，并依据截止时间及优先级给出关注顺序和原因。 |
| [AA-REAL-TEST-002](./cloud-review/current/#failure-test-AA-REAL-TEST-002) | 智本_anrou | 失败 | 失败 | 第一轮漏了17项截止时间已过、但还未开始的任务。追问后答对了，仍不能抹掉第一轮的漏答。 |
| [AA-REAL-TEST-003](./cloud-review/current/#failure-test-AA-REAL-TEST-003) | 智本_anrou | 通过 | 通过 | 两轮均按实际追问时的东京自然周11月9日至15日，限定项目甲、乙并保留主任务和子孙任务范围，零项结论与认证源数据一致。第二轮增加未开始条件后仍为空，因此无需列出负责人和截止时间，不能套用10月的静态数量。 |
| [AA-REAL-TEST-004](./cloud-review/current/#failure-test-AA-REAL-TEST-004) | 智本_anrou | 失败 | 通过 | 按两轮实际追问时的东京时间，未来7天为11月9日至15日，当前完整任务树中没有符合条件的未完成到期任务，零结果正确。追问回答还完整列出了8项未设置截止时间的未完成任务，按未开始和进行中各4项分开展示，并提供了可追溯引用。 |
| [AA-REAL-TEST-005](./cloud-review/current/#failure-test-AA-REAL-TEST-005) | 智本_anrou | 通过 | 通过 | 首轮正确列出7项本人创建且有他人执行的未完成任务，包含共同执行的任务010。追问后正确排除任务010，保留6项完全交给他人的任务，结果与各轮追问前的源数据一致。 |
| [AA-REAL-TEST-006](./cloud-review/current/#failure-test-AA-REAL-TEST-006) | 智本_anrou | 失败 | 失败 | 每人的未完成任务总数答对了，但把追问人的逾期任务说成0项，漏了17项已过截止时间、仍未开始的任务。 |
| [AA-REAL-TEST-007](./cloud-review/current/#failure-test-AA-REAL-TEST-007) | 智本_anrou | 通过 | 通过 | 回答正确说明两个指定项目中没有父任务已完成、直接子任务未完成的情况，因此无需列出父子任务负责人。项目甲21项、项目乙1项已完成任务均无直接子任务，数量、状态和引用与本轮源数据一致。 |
| [AA-REAL-TEST-008](./cloud-review/current/#failure-test-AA-REAL-TEST-008) | 智本_anrou | 通过 | 通过 | 首轮完整列出22项未完成后代，包含孙任务064，并将11项高优先级任务列在前面。第二轮逐项给出正确执行人和可定位引用，保留040、060的共同执行人，未扩大查询范围。 |
| [AA-REAL-TEST-009](./cloud-review/current/#failure-test-AA-REAL-TEST-009) | 智本_anrou | 失败 | 通过 | 回答正确识别共同任务执行人只有智本_Anna7，并分别说明其在项目甲、乙均无未完成任务。结论与追问前的当轮完整递归源数据一致，人员提及及项目、任务引用均可定位。 |
| [AA-REAL-TEST-010](./cloud-review/current/#failure-test-AA-REAL-TEST-010) | 智本_anrou | 失败 | 通过 | 回答按两个附件项目的完整层级给出了完成数和剩余数，与追问前的当前源数据一致。列出了五项具体重点任务及执行人、优先级、截止时间和可定位引用，并明确当前已完成数不代表本周新增完成数。 |
| [AA-REAL-TEST-011](./cloud-review/current/#failure-test-AA-REAL-TEST-011) | 智本_anrou | 失败 | 通过 | 回答正确限定在附件中的项目甲、乙，并覆盖主任务及全部子孙任务，未发现未完成且无执行人的任务。项目甲42项未完成任务及20项主任务、22项子孙任务的数量与当轮源数据一致，项目乙也确无未完成任务。 |
| [AA-REAL-TEST-012](./cloud-review/current/#failure-test-AA-REAL-TEST-012) | 智本_anrou | 失败 | 通过 | 首轮准确列出所选两个项目中8项未完成且缺截止时间的任务，执行人、项目归属和任务引用均与当轮源数据一致。追问保留原条件并筛出4项高优先级任务，没有将已排期或已完成任务混入结果。 |
| [AA-REAL-TEST-013](./cloud-review/current/#failure-test-AA-REAL-TEST-013) | 智本_anrou | 失败 | 失败 | 任务和更新时间都答对了，但把“最近7天”改成按自然日查询，少覆盖了一段时间。当前证据没有证明因此漏了任务。 |
| [AA-REAL-TEST-014](./cloud-review/current/#failure-test-AA-REAL-TEST-014) | 智本_anrou | 通过 | 通过 | 首轮正确定位任务033，待启动与源数据的未开始语义一致，执行人智本_anrou也正确。次轮延续同一任务指代，准确给出上级任务001和唯一直接子任务064，并提供可定位引用。 |
| [AA-REAL-TEST-015](./cloud-review/current/#failure-test-AA-REAL-TEST-015) | 智本_anrou | 通过 | 通过 | 首轮识别到项目名称有歧义并请求澄清，没有擅自选取或汇总项目。次轮仅查询项目乙，回答没有未完成任务，与追问前认证回读中唯一任务已完成的事实一致，并给出了可定位的项目引用。 |
| [AA-REAL-TEST-016](./cloud-review/current/#failure-test-AA-REAL-TEST-016) | 智本_anrou | 通过 | 通过 | 首轮准确对比了所选三条任务的状态、执行人、优先级和东京时间截止时间，未扩大选择范围。追问正确排除已完成的032，依据优先级和已过截止时间建议先协调001、尽快启动033，并明确未确认具体阻塞或依赖。 |
| [AA-REAL-TEST-017](./cloud-review/current/#failure-test-AA-REAL-TEST-017) | 智本_anrou | 失败 | 通过 | 两轮回答均符合追问当时的完整任务树，正确区分去重任务数和多人执行人次。第二轮重新筛选高优先级未完成任务，并完整列出两位执行人的任务清单及可定位引用。 |
| [AA-REAL-TEST-018](./cloud-review/current/#failure-test-AA-REAL-TEST-018) | 智本_anrou | 失败 | 失败 | 用户已指定查询Anna，且本轮数据中有明确身份和任务关系，回答仍只要求澄清，没有给出Anna的未完成任务。 |
| [AA-REAL-TEST-019](./cloud-review/current/#failure-test-AA-REAL-TEST-019) | 智本_anrou | 通过 | 通过 | 两轮按实际追问时间正确解释为2026年11月及更正后的12月，并保留两个所选项目和未完成条件。逐轮认证源的完整递归任务数据支持两个月均无符合条件的任务，回答给出了明确零结果和可定位的项目引用。 |
| [AA-REAL-TEST-020](./cloud-review/current/#failure-test-AA-REAL-TEST-020) | 智本_anrou | 失败 | 通过 | 回答完整列出本轮符合条件的17项任务，按执行人智本_Anna整理，数量、状态、截止时间和项目归属均与当轮源数据一致。已提供可定位引用及催办草稿，没有发送消息；旧快照的5项结果不适用于本轮时间。 |
| [AA-RPT-TEST-001](./cloud-review/current/#failure-test-AA-RPT-TEST-001) | 智本_anrou | 延期 | 延期 | 细节问题，不可能覆盖所有 |
| [AA-WR-TEST-001](./cloud-review/current/#failure-test-AA-WR-TEST-001) | CFO | 通过 | 通过 | 首轮正确追问空间和项目成员，独立业务回读确认没有提前创建。补齐信息后直接且仅创建一个项目，名称、所属空间、当前租户及唯一成员均符合用户要求，成功反馈有真实创建结果支持。 |
| [AA-WR-TEST-002](./cloud-review/current/#failure-test-AA-WR-TEST-002) | CFO | 通过 | 通过 | 首轮缺少所属项目时先追问，业务回读确认未写入。补齐后直接创建且仅创建一个任务，标题、租户及项目空间归属正确，成功反馈与实际业务结果一致。 |
| [AA-WR-TEST-003](./cloud-review/current/#failure-test-AA-WR-TEST-003) | CFO | 通过 | 通过 | 首轮缺少目标任务时正确追问，独立业务回读确认没有写入。补齐任务和项目后直接创建且仅创建一条指定评论，内容、目标和租户均正确，成功反馈与真实结果一致。 |
| [AA-WR-TEST-004](./cloud-review/current/#failure-test-AA-WR-TEST-004) | CFO | 通过 | 通过 | 首轮缺少目标项目时正确追问，业务回读确认未发生写入。补齐项目和空间后直接创建了唯一一条评论，内容、归属及租户正确，成功反馈与真实结果一致。 |
| [AA-WR-TEST-005](./cloud-review/current/#failure-test-AA-WR-TEST-005) | CFO | 通过 | 通过 | 目标空间已核实属于其他租户，两轮回答均明确拒绝跨租户创建，未因用户再次确认而放行。逐轮业务回读确认新增项目均为零，回答也未声称创建成功。 |
| [AA-WR-TEST-006](./cloud-review/current/#failure-test-AA-WR-TEST-006) | CFO | 通过 | 通过 | 两轮均核实目标项目属于其他租户并明确拒绝创建，用户再次确认也未越过租户边界。独立业务回读确认两轮新增任务均为零，回答没有声称创建成功。 |
| [AA-WR-TEST-007](./cloud-review/current/#failure-test-AA-WR-TEST-007) | CFO | 通过 | 通过 | 目标任务属于 T1120BGCN，与当前追问人所在的 T1120BFPA 不同，助手两轮均明确拒绝跨租户添加评论。用户再次确认后也未越过租户边界，两轮业务回读均确认新增评论数为0。 |
| [AA-WR-TEST-008](./cloud-review/current/#failure-test-AA-WR-TEST-008) | CFO | 通过 | 通过 | 两轮均明确拒绝跨租户添加项目评论，并说明未执行写入，用户再次确认也未越过租户边界。目标项目归属外租户的事实已核实，逐轮业务回读均确认新增评论为零。 |
| [AA-LANG-TEST-001](./cloud-review/current/#failure-test-AA-LANG-TEST-001) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-LANG-TEST-002](./cloud-review/current/#failure-test-AA-LANG-TEST-002) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-LANG-TEST-003](./cloud-review/current/#failure-test-AA-LANG-TEST-003) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |
| [AA-LANG-TEST-004](./cloud-review/current/#failure-test-AA-LANG-TEST-004) | CFO | 通过 | 通过 | 回答正确给出任务所属项目，并完整保留英文项目正式名称。状态“未着手”与未开始语义一致，说明使用日语，引用也指向当前租户对象。 |
| [AA-LANG-TEST-005](./cloud-review/current/#failure-test-AA-LANG-TEST-005) | CFO | 通过 | 失败 | 模型服务额度已用尽，返回429，未能生成回答。已换新会话重跑一次，仍未恢复；两次请求均保留。 |

延期用例原AI裁判及人工复核来源保留；本轮没有新建其会话或夹具。未执行与待复核分开统计。
