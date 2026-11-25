# Visualization and performance

## Analyser feed
- Properties: `fftSize` (power of two), `frequencyBinCount` (half of `fftSize`), `smoothingTimeConstant` (0 to 1), `minDecibels`, `maxDecibels`.
- Read methods: byte and float variants for frequency and time-domain data. Use float when dB values are needed, byte when 0..255 suffices.
- Bin width is `sampleRate / fftSize`. A larger `fftSize` gives finer frequency detail and a longer time window. Choose from measurement, store as a constant, note it in `docs/audio/`.
- Allocate read buffers once per `fftSize`; reallocate only when it changes.

## Frame loop
1. `start()` schedules `requestAnimationFrame`; each frame reads, maps, draws and reschedules.
2. On `visibilitychange` to hidden, cancel the frame. On visible, restart.
3. On unmount or dispose, cancel and drop references.
4. A slow frame drops frames and never paces audio.
5. The loop lives outside React render. A component hands a canvas to the visualizer; no React state update per frame.

## Whole-track waveform
Compute peaks once per track with a pure function, in chunks that yield so a long file does not block the main thread (use a worker only if the build supports it; check the tooling docs). Cache by track id. With a streaming source (decision 4 pending) an overview needs a separate decode; flag that cost first.

## Performance checklist
- No per-frame allocation (confirm with a profiler).
- Canvas size follows display size and device pixel ratio.
- Precompute bin-to-bar index tables when `fftSize`, `sampleRate` or `barCount` change.
- `process()` must fit the render quantum: 128 frames at 48 kHz is about 2.7 ms. Measure.
- Do not chain worklets for what `AnalyserNode` already provides.
- Throttle worklet-to-main messages (one per N quanta, N a named constant).

## Latency and glitch analysis
- Record `baseLatency` and `outputLatency` where available.
- Glitch sources: main-thread stalls during decode, streaming underruns, worklet overruns, device changes, resampling on sample-rate mismatch.
- Method: play a test-tone fixture, stall the main thread on purpose, confirm audio continues. Log only outside the audio thread.
- Report platform, device class, context options and measured values in `docs/audio/`. Mark VERIFIED only when measured.

## Memory
A decoded buffer holds float samples for the whole track at the context sample rate, so memory grows linearly with duration, channels and rate. Estimate before choosing full decode for long files; this feeds open decision 4. Release buffers on track change, and hold two at once only for gapless preload.
