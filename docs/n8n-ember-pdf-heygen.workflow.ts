/**
 * n8n Workflow SDK — Ember PDF → HeyGen lesson video
 * Validate with n8n MCP validate_workflow before create_workflow_from_code.
 *
 * Setup:
 * - OpenAI credential: "OpenAI account"
 * - Header Auth credential "HeyGen API": name = X-Api-Key, value = HeyGen key
 * - Edit Set node HEYGEN_AVATAR_ID / HEYGEN_VOICE_ID
 * - Publish workflow; copy Production webhook URL into Ember N8N_WEBHOOK_URL
 */
import {
  workflow,
  trigger,
  node,
  sticky,
  ifElse,
  expr,
  newCredential,
} from '@n8n/workflow-sdk';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Ember Generate Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'ember-pdf-heygen',
      authentication: 'none',
      responseMode: 'responseNode',
    },
  },
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Ack queued',
    parameters: {
      respondWith: 'json',
      responseBody: '={{ { "ok": true, "lessonId": $json.body.lessonId } }}',
      options: { responseCode: 200 },
    },
  },
});

const normalize = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Normalize payload',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'lessonId', name: 'lessonId', type: 'string', value: expr('{{ $json.body.lessonId }}') },
          { id: 'callbackUrl', name: 'callbackUrl', type: 'string', value: expr('{{ $json.body.callbackUrl }}') },
          { id: 'secret', name: 'secret', type: 'string', value: expr('{{ $json.body.secret }}') },
          { id: 'pageImageUrls', name: 'pageImageUrls', type: 'array', value: expr('{{ $json.body.pageImageUrls }}') },
          { id: 'extractedText', name: 'extractedText', type: 'array', value: expr('{{ $json.body.extractedText }}') },
          { id: 'pdfUrl', name: 'pdfUrl', type: 'string', value: expr('{{ $json.body.pdfUrl }}') },
          { id: 'jobId', name: 'jobId', type: 'string', value: expr('{{ $json.body.jobId }}') },
          {
            id: 'avatarId',
            name: 'heygenAvatarId',
            type: 'string',
            value: 'Angela-inTshirt-20220820',
          },
          {
            id: 'voiceId',
            name: 'heygenVoiceId',
            type: 'string',
            value: '1bd001e7e50f421d891986aad5158bc8',
          },
        ],
      },
    },
  },
});

const statusExtracting = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Status extracting',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "extracting" } }}'),
    },
  },
});

const prepareVision = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare vision input',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const src = $('Normalize payload').first().json;
const urls = Array.isArray(src.pageImageUrls) ? src.pageImageUrls : [];
const texts = Array.isArray(src.extractedText) ? src.extractedText : [];
const pages = urls.map((url, i) => ({
  pageNum: i + 1,
  url,
  text: typeof texts[i] === 'string' ? texts[i] : '',
  needsOcr: !texts[i] || String(texts[i]).trim().length < 40,
}));
const visionUrls = pages.filter((p) => p.needsOcr).map((p) => p.url);
return [{
  json: {
    ...src,
    pages,
    visionUrlsCsv: visionUrls.join(','),
    needsVision: visionUrls.length > 0,
  },
}];`,
    },
  },
});

const needsVision = ifElse({
  version: 2.3,
  config: {
    name: 'Needs Vision OCR?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        combinator: 'and',
        conditions: [
          {
            id: 'nv',
            leftValue: expr('{{ $json.needsVision }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
    },
  },
});

const analyzePages = node({
  type: '@n8n/n8n-nodes-langchain.openAi',
  version: 2.3,
  config: {
    name: 'Analyze PDF pages',
    credentials: { openAiApi: newCredential('OpenAI account') },
    parameters: {
      resource: 'image',
      operation: 'analyze',
      modelId: { __rl: true, mode: 'id', value: 'gpt-4o', cachedResultName: 'GPT-4O' },
      inputType: 'url',
      imageUrls: expr('{{ $json.visionUrlsCsv }}'),
      text: 'You are extracting CAPS Grade 12 Mathematics from scanned lesson PDF page images. For each image in order, return clear prose with inline LaTeX ($...$ / $$...$$). Separate pages with a line containing only ---PAGE---. Do not invent topics not visible on the pages.',
      simplify: true,
      options: { detail: 'high', maxTokens: 2500 },
    },
  },
});

const mergeExtract = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Merge page text',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const prep = $('Prepare vision input').first().json;
let visionText = '';
try {
  const visionItem = $('Analyze PDF pages').first();
  if (visionItem && visionItem.json) {
    visionText = visionItem.json.content || visionItem.json.text || visionItem.json.output || JSON.stringify(visionItem.json);
  }
} catch (e) {
  visionText = '';
}
const ocrParts = String(visionText).split('---PAGE---').map((s) => s.trim()).filter(Boolean);
let ocrIdx = 0;
const pages = (prep.pages || []).map((p) => {
  if (p.needsOcr && ocrParts[ocrIdx]) {
    const text = ocrParts[ocrIdx];
    ocrIdx += 1;
    return { ...p, text };
  }
  return p;
});
const combined = pages.map((p) => 'Page ' + p.pageNum + ':\\n' + (p.text || '(no text)')).join('\\n\\n');
return [{
  json: {
    lessonId: prep.lessonId,
    callbackUrl: prep.callbackUrl,
    secret: prep.secret,
    heygenAvatarId: prep.heygenAvatarId,
    heygenVoiceId: prep.heygenVoiceId,
    pages,
    combinedText: combined,
  },
}];`,
    },
  },
});

const statusScripting = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Status scripting',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "scripting" } }}'),
    },
  },
});

const writeScenes = node({
  type: '@n8n/n8n-nodes-langchain.openAi',
  version: 2.3,
  config: {
    name: 'Write scene scripts',
    credentials: { openAiApi: newCredential('OpenAI account') },
    parameters: {
      resource: 'text',
      operation: 'response',
      modelId: { __rl: true, mode: 'id', value: 'gpt-4o', cachedResultName: 'GPT-4O' },
      simplify: true,
      responses: {
        values: [
          {
            type: 'text',
            role: 'system',
            content:
              'You write educational narration for South African CAPS Grade 12 Mathematics. Reply with ONLY valid JSON: {"scenes":[{"spokenScript":string,"latex":string,"pageImageIndex":number,"visualHint":string}]}. Max 8 scenes. spokenScript must speak equations aloud (e.g. "E equals m c squared"). pageImageIndex is 0-based into the page list.',
          },
          {
            type: 'text',
            role: 'user',
            content: expr('={{ "Create up to 8 teaching scenes from this lesson material.\\n\\nPages JSON:\\n" + JSON.stringify($("Merge page text").item.json.pages.map(p => ({ pageNum: p.pageNum, url: p.url, text: p.text }))) + "\\n\\nCombined text:\\n" + $("Merge page text").item.json.combinedText }}'),
          },
        ],
      },
    },
  },
});

const buildHeygen = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build HeyGen payload',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const base = $('Merge page text').first().json;
const raw = $input.first().json;
let content = raw.content || raw.text || raw.output || '';
if (typeof content !== 'string') content = JSON.stringify(content);
const match = content.match(/\\{[\\s\\S]*\\}/);
if (!match) {
  return [{ json: { ...base, error: 'LLM did not return JSON scenes', failed: true } }];
}
let parsed;
try {
  parsed = JSON.parse(match[0]);
} catch (e) {
  return [{ json: { ...base, error: 'Failed to parse scenes JSON', failed: true } }];
}
const pages = base.pages || [];
const scenesIn = Array.isArray(parsed.scenes) ? parsed.scenes.slice(0, 8) : [];
const scenes = scenesIn.map((s, i) => {
  const idx = Math.min(Math.max(Number(s.pageImageIndex) || 0, 0), Math.max(pages.length - 1, 0));
  const page = pages[idx] || pages[0];
  return {
    spokenScript: String(s.spokenScript || '').slice(0, 1500),
    latex: s.latex ? String(s.latex) : '',
    pageImageUrl: page ? page.url : '',
    visualHint: s.visualHint ? String(s.visualHint) : '',
  };
}).filter((s) => s.spokenScript && s.pageImageUrl);

if (scenes.length === 0) {
  return [{ json: { ...base, error: 'No usable scenes', failed: true } }];
}

const video_inputs = scenes.map((s) => ({
  character: {
    type: 'avatar',
    avatar_id: base.heygenAvatarId,
    avatar_style: 'normal',
  },
  voice: {
    type: 'text',
    input_text: s.spokenScript,
    voice_id: base.heygenVoiceId,
  },
  background: {
    type: 'image',
    url: s.pageImageUrl,
  },
}));

return [{
  json: {
    lessonId: base.lessonId,
    callbackUrl: base.callbackUrl,
    secret: base.secret,
    scenes,
    heygenBody: {
      video_inputs,
      dimension: { width: 1280, height: 720 },
    },
    failed: false,
  },
}];`,
    },
  },
});

const scenesOk = ifElse({
  version: 2.3,
  config: {
    name: 'Scenes OK?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        combinator: 'and',
        conditions: [
          {
            id: 'ok',
            leftValue: expr('{{ $json.failed }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'false' },
          },
        ],
      },
    },
  },
});

const failScenes = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Callback failed scenes',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "failed", error: $json.error || "Scene generation failed" } }}'),
    },
  },
});

const statusRendering = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Status rendering',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "rendering", scenes: $json.scenes } }}'),
    },
  },
});

const restoreAfterRenderStatus = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Restore after render status',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `return [{ json: $('Build HeyGen payload').first().json }];`,
    },
  },
});

const createHeygen = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Create HeyGen video',
    credentials: { httpHeaderAuth: newCredential('HeyGen API') },
    parameters: {
      method: 'POST',
      url: 'https://api.heygen.com/v2/video/generate',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ $json.heygenBody }}'),
    },
  },
});

const afterCreate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Capture video id',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const built = $('Build HeyGen payload').first().json;
const res = $input.first().json;
const videoId = res.data && res.data.video_id ? res.data.video_id : (res.video_id || null);
if (!videoId) {
  return [{ json: { ...built, failed: true, error: 'HeyGen did not return video_id: ' + JSON.stringify(res).slice(0, 400) } }];
}
return [{ json: { ...built, heygenVideoId: videoId, failed: false } }];`,
    },
  },
});

const createOk = ifElse({
  version: 2.3,
  config: {
    name: 'HeyGen create OK?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        combinator: 'and',
        conditions: [
          {
            id: 'cid',
            leftValue: expr('{{ $json.failed }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'false' },
          },
        ],
      },
    },
  },
});

const failCreate = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Callback failed create',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "failed", error: $json.error || "HeyGen create failed" } }}'),
    },
  },
});

const wait1 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Wait 90s',
    parameters: {
      resume: 'timeInterval',
      amount: 90,
      unit: 'seconds',
    },
  },
});

const poll1 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Poll HeyGen 1',
    credentials: { httpHeaderAuth: newCredential('HeyGen API') },
    parameters: {
      method: 'GET',
      url: expr('={{ "https://api.heygen.com/v1/video_status.get?video_id=" + $json.heygenVideoId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
  },
});

const afterPoll1 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse poll 1',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const ctx = $('Capture video id').first().json;
const res = $input.first().json;
const data = res.data || res;
const status = data.status || '';
const videoUrl = data.video_url || data.url || null;
return [{
  json: {
    ...ctx,
    heygenStatus: status,
    heygenVideoUrl: videoUrl,
    completed: status === 'completed' && !!videoUrl,
    heygenFailed: status === 'failed' || status === 'error',
  },
}];`,
    },
  },
});

const done1 = ifElse({
  version: 2.3,
  config: {
    name: 'Ready after poll 1?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        combinator: 'and',
        conditions: [
          {
            id: 'd1',
            leftValue: expr('{{ $json.completed }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
    },
  },
});

const callbackReady = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Callback ready',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "ready", scenes: $json.scenes, heygenVideoId: $json.heygenVideoId, heygenVideoUrl: $json.heygenVideoUrl } }}'),
    },
  },
});

const wait2 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Wait another 90s',
    parameters: {
      resume: 'timeInterval',
      amount: 90,
      unit: 'seconds',
    },
  },
});

const poll2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Poll HeyGen 2',
    credentials: { httpHeaderAuth: newCredential('HeyGen API') },
    parameters: {
      method: 'GET',
      url: expr('={{ "https://api.heygen.com/v1/video_status.get?video_id=" + $json.heygenVideoId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
  },
});

const afterPoll2 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse poll 2',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const ctx = $('Parse poll 1').first().json;
const res = $input.first().json;
const data = res.data || res;
const status = data.status || '';
const videoUrl = data.video_url || data.url || null;
const completed = status === 'completed' && !!videoUrl;
return [{
  json: {
    ...ctx,
    heygenStatus: status,
    heygenVideoUrl: videoUrl,
    completed,
    error: completed ? null : ('HeyGen status after wait: ' + status),
  },
}];`,
    },
  },
});

const done2 = ifElse({
  version: 2.3,
  config: {
    name: 'Ready after poll 2?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        combinator: 'and',
        conditions: [
          {
            id: 'd2',
            leftValue: expr('{{ $json.completed }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
    },
  },
});

const callbackReady2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Callback ready 2',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "ready", scenes: $json.scenes, heygenVideoId: $json.heygenVideoId, heygenVideoUrl: $json.heygenVideoUrl } }}'),
    },
  },
});

const callbackTimeout = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Callback timeout',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.callbackUrl }}'),
      authentication: 'none',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'X-Ember-Secret', value: expr('{{ $json.secret }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('={{ { lessonId: $json.lessonId, status: "failed", heygenVideoId: $json.heygenVideoId, error: $json.error || "HeyGen render timed out" } }}'),
    },
  },
});

const setupNote = sticky(
  '## Ember PDF → HeyGen\n1. Credential **HeyGen API** (HTTP Header Auth): name=`X-Api-Key`, value=HeyGen key\n2. Edit **Normalize payload** avatar/voice IDs\n3. Publish; set Ember `N8N_WEBHOOK_URL` to Production URL\n4. Uses HeyGen **v2** multi-scene (migrate to v3 before Nov 2026)',
  { position: [160, -120] },
);

export default workflow(
  'ember-pdf-heygen-lesson-video',
  'Ember PDF to HeyGen lesson video',
)
  .add(webhook)
  .to(respond)
  .to(normalize)
  .to(statusExtracting)
  .to(prepareVision)
  .to(
    needsVision
      .onTrue(analyzePages.to(mergeExtract))
      .onFalse(mergeExtract),
  )
  .add(mergeExtract)
  .to(statusScripting)
  .to(writeScenes)
  .to(buildHeygen)
  .to(
    scenesOk
      .onTrue(
        statusRendering
          .to(restoreAfterRenderStatus)
          .to(createHeygen)
          .to(afterCreate)
          .to(
            createOk
              .onTrue(
                wait1
                  .to(poll1)
                  .to(afterPoll1)
                  .to(
                    done1
                      .onTrue(callbackReady)
                      .onFalse(
                        wait2
                          .to(poll2)
                          .to(afterPoll2)
                          .to(
                            done2
                              .onTrue(callbackReady2)
                              .onFalse(callbackTimeout),
                          ),
                      ),
                  ),
              )
              .onFalse(failCreate),
          ),
      )
      .onFalse(failScenes),
  )
  .group('Script scenes', [statusScripting, writeScenes, buildHeygen], {
    description: 'Status callback, LLM scene scripts, and HeyGen payload build.',
  })
  .group('HeyGen render', [statusRendering, restoreAfterRenderStatus, createHeygen, afterCreate], {
    description: 'Restore context after status, create HeyGen video, capture id.',
  })
  .add(setupNote);
