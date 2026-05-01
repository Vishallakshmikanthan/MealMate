# Teachable Machine Model Files

Place your exported TensorFlow.js model files here:

```
public/model/
  model.json        ← main model architecture + weight manifest
  weights.bin       ← compiled model weights (auto-referenced by model.json)
  metadata.json     ← class labels + image size
```

## Training Steps

1. Go to https://teachablemachine.withgoogle.com/train/image
2. Create classes:
   - idly
   - dosa
   - poori
   - chapathi
   - rice
   - sambar
   - unknown  ← add this to reduce false positives
3. Upload 30–50 images per class (different angles, lighting, plates)
4. Click **Train Model**
5. Click **Export Model** → TensorFlow.js → **Download**
6. Unzip and copy the three files into this folder

Once files are present the app will automatically use your model instead of MobileNet.
