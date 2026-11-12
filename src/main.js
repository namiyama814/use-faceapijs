import './style.css';
import { expressions, largestFace, smoothScores } from './expressions.js';

const $ = (id) => document.getElementById(id);
const video = $('video');
let stream = null;
let generation = 0;
let modelPromise;
let smoothed = null;
let busy = false;
let activeInference = Promise.resolve();
let animationTimer;

function resetResults() {
  smoothed = null;
  $('dominant-name').textContent = '解析中';
}
function releaseStream() {
  clearTimeout(animationTimer);
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  $('viewport').classList.remove('streaming');
}
function stop() {
  generation++;
  releaseStream();
  busy = false;
  $('start').textContent = 'カメラを開始';
  $('start').disabled = false;
  resetResults();
  $('message').textContent = '';
}
function loadModels() {
  if (!modelPromise) {
    modelPromise = (async () => {
      // The vendored script is deferred; wait for the document scripts to finish.
      if (document.readyState !== 'complete') await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
      if (!window.faceapi) throw new Error('MODEL_LOAD');
      const base = `${import.meta.env.BASE_URL}models`;
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(base),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(base),
        faceapi.nets.faceExpressionNet.loadFromUri(base),
      ]);
    })().catch(error => { modelPromise = null; throw error; });
  }
  return modelPromise;
}
async function start() {
  if (busy || stream) return;
  const token = ++generation;
  releaseStream();
  resetResults();
  busy = true;
  $('start').disabled = true;
  $('message').textContent = '';
  let stage = 'camera';
  try {
    if (!window.isSecureContext) throw new Error('INSECURE');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('UNSUPPORTED');
    const acquired = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 1280 }, height: { ideal: 960 }, aspectRatio: { ideal: 4 / 3 }, facingMode: 'user' } });
    if (token !== generation) { acquired.getTracks().forEach(t => t.stop()); return; }
    stream = acquired;
    video.srcObject = stream;
    await video.play();
    if (token !== generation) return;
    stream.getVideoTracks()[0].addEventListener('ended', () => { if (token === generation) { stop(); $('message').textContent = 'カメラとの接続が終了しました。もう一度開始してください。'; } });
    stage = 'model';
    $('message').textContent = 'モデルを読み込み中…';
    await loadModels();
    await activeInference.catch(() => {});
    if (token !== generation) return;
    $('viewport').classList.add('streaming');
    $('start').disabled = true;
    $('message').textContent = '';
    busy = false;
    analyze(token);
  } catch (error) {
    if (token !== generation) return;
    stop();
    const messages = {
      NotAllowedError: 'カメラが許可されていません。ブラウザのサイト設定でカメラを許可してください。',
      NotFoundError: 'カメラが見つかりません。接続を確認してください。',
      NotReadableError: 'カメラを開けません。他のアプリで使用していないか確認してください。',
      INSECURE: 'カメラを使うには HTTPS または localhost で開いてください。',
      UNSUPPORTED: 'このブラウザはカメラに対応していません。最新の Chrome、Edge、Safari などで開いてください。',
    };
    $('message').textContent = messages[error.name] || messages[error.message] || (stage === 'model' ? '解析モデルを読み込めませんでした。ページを再読み込みするか、もう一度お試しください。' : 'カメラを開始できませんでした。もう一度お試しください。');
    $('start').textContent = 'もう一度開始';
    console.error(error);
  }
}
async function analyze(token) {
  if (token !== generation || !stream) return;
  const started = performance.now();
  try {
    activeInference = Promise.resolve(faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks(true).withFaceExpressions());
    const results = await activeInference;
    if (token !== generation) return;
    const main = largestFace(results);
    if (!main) {
      resetResults();
      $('dominant-name').textContent = '解析中';
    } else {
      smoothed = smoothScores(smoothed, main.expressions);
      const dominant = expressions.reduce((a, b) => smoothed[a.key] > smoothed[b.key] ? a : b);
      $('dominant-name').textContent = dominant.name;

    }
    animationTimer = setTimeout(() => analyze(token), Math.max(0, 150 - (performance.now() - started)));
  } catch (error) {
    if (token !== generation) return;
    stop();
    $('message').textContent = '解析中にエラーが発生しました。もう一度カメラを開始してください。';
    console.error(error);
  }
}
$('start').addEventListener('click', start);
window.addEventListener('pagehide', stop);
