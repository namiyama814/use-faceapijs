# Expression Studio

face-api.js で Web カメラの映像をリアルタイムに解析する、クライアント専用の Web アプリです。

## 起動

Node.js 22.12 以上が必要です。

```sh
npm install
npm run dev
```

表示された localhost の URL を開き、「カメラを開始」を押してカメラを許可してください。カメラには **localhost または HTTPS** が必要です。`file://` には対応しません。

## 機能

- ニュートラル・笑顔・悲しみ・怒り・恐れ・嫌悪・驚きのうち、現在の表情のみ表示
- 複数人の場合は、最も大きく映る顔の表情を表示
- 表情の平滑化、カメラ開始後はボタンを非表示、映像は4:3で表示
- 権限拒否、接続終了、モデル読み込み失敗時の表示

映像・解析結果は保存・送信しません。API サーバー、API キー、外部 CDN は不要です。モデルとライブラリを同一サイトから読み込み、ブラウザ内で推論します。画面を閉じるとカメラを解放します。

表情スコアはモデルの推定値です。実際の感情や心理状態の判定には使えません。端末性能や照明によって精度・速度が変わります。

## 検証・ビルド

```sh
npm test
npm run build
npm run preview
```

`dist/` を HTTPS 対応の静的ホスティングに配置できます。サブパスへの配置は `npm run build -- --base=/your-path/` を使ってください。

## ライブラリとモデル

[face-api.js 0.22.2](https://github.com/justadudewhohacks/face-api.js/tree/0.22.2) の配布ファイル・モデルを `public/` に同梱しています。公式の `detectAllFaces(...).withFaceLandmarks(true).withFaceExpressions()` を使用します。

- Tiny Face Detector
- Tiny 68 Point Face Landmark
- Face Expression Recognition

ライセンスは [public/vendor/face-api.LICENSE](public/vendor/face-api.LICENSE) を参照してください。
