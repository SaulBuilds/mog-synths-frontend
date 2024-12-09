import React, { useState, useRef, useEffect } from 'react';

interface SynthControllerProps {
  onGenerate: (hexData: string) => void;
  generatedHex?: string;
}

const SynthController: React.FC<SynthControllerProps> = ({ onGenerate, generatedHex }) => {
  const [waveform, setWaveform] = useState<'sine' | 'square' | 'sawtooth' | 'triangle'>('sine');
  const [frequency, setFrequency] = useState<number>(440);

  // ADSR via XY pad for Attack/Decay
  const [attack, setAttack] = useState<number>(0.1);
  const [decay, setDecay] = useState<number>(0.1);

  const [sustain, setSustain] = useState<number>(0.7);
  const [release, setRelease] = useState<number>(0.5);
  const [bitDepth, setBitDepth] = useState<number>(16);
  const [duration, setDuration] = useState<number>(1.0);

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // XY Pad state
  const xyPadRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const updateADSRFromXY = (clientX: number, clientY: number) => {
    if (!xyPadRef.current) return;
    const rect = xyPadRef.current.getBoundingClientRect();
    const xRatio = (clientX - rect.left) / rect.width;
    const yRatio = (clientY - rect.top) / rect.height;

    // Attack range 0 to 2
    const newAttack = Math.max(0, Math.min(2, xRatio * 2));
    // Decay range 0 to 2
    const newDecay = Math.max(0, Math.min(2, yRatio * 2));

    setAttack(newAttack);
    setDecay(newDecay);
  };

  const onMouseDownXY = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateADSRFromXY(e.clientX, e.clientY);
  };

  const onMouseMoveXY = (e: MouseEvent) => {
    if (!isDragging) return;
    updateADSRFromXY(e.clientX, e.clientY);
  };

  const onMouseUpXY = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMoveXY);
    window.addEventListener('mouseup', onMouseUpXY);
    return () => {
      window.removeEventListener('mousemove', onMouseMoveXY);
      window.removeEventListener('mouseup', onMouseUpXY);
    };
  }, [isDragging]);

  const generateSound = async () => {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);

    const offlineContext = new OfflineAudioContext(1, numSamples, sampleRate);
    const oscillator = offlineContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, 0);

    const gainNode = offlineContext.createGain();

    const now = offlineContext.currentTime;
    const end = now + duration;
    const attackEnd = now + attack;
    const decayEnd = attackEnd + decay;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, attackEnd);
    gainNode.gain.linearRampToValueAtTime(sustain, decayEnd);
    gainNode.gain.setValueAtTime(sustain, end - release);
    gainNode.gain.linearRampToValueAtTime(0, end);

    oscillator.connect(gainNode).connect(offlineContext.destination);
    oscillator.start(now);
    oscillator.stop(end);

    const renderedBuffer = await offlineContext.startRendering();
    setAudioBuffer(renderedBuffer);

    const channelData = renderedBuffer.getChannelData(0);
    const intArray = float32ToIntPCM(channelData, bitDepth);
    const hexData = toHex(intArray);
    onGenerate(hexData);

    drawWaveform(channelData);
  };

  const float32ToIntPCM = (float32Array: Float32Array, bits: number) => {
    const maxVal = 2 ** (bits - 1) - 1;
    const intArray = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      intArray[i] = Math.max(-1, Math.min(1, float32Array[i])) * maxVal;
    }
    return intArray;
  };

  const toHex = (intArray: Int16Array) => {
    let hexString = '0x';
    for (let i = 0; i < intArray.length; i++) {
      const val = intArray[i];
      const unsignedVal = val < 0 ? val + 0x10000 : val;
      const hex = unsignedVal.toString(16).padStart(4, '0');
      hexString += hex;
    }
    return hexString;
  };

  const prepareAudioContext = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
  };

  const playSound = async (loop: boolean = false) => {
    if (!audioBuffer) {
      console.log('No audio buffer to play. Generate sound first.');
      return;
    }

    await prepareAudioContext();
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    stopSound();

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.loop = loop;
    source.start(0);
    sourceRef.current = source;
  };

  const stopSound = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  };

  const drawWaveform = (data: Float32Array) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#00f';
    ctx.beginPath();
    const step = Math.floor(data.length / canvas.width);
    const midY = canvas.height / 2;
    for (let i = 0; i < canvas.width; i++) {
      const sampleIndex = i * step;
      const amplitude = data[sampleIndex] * midY;
      const y = midY - amplitude;
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();
  };

  return (
    <div className="max-w-lg mx-auto p-6 text-white rounded-xl shadow-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <h3 className="text-2xl font-bold mb-4">Synth Controls</h3>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">
          Waveform:
        </label>
        <select
          value={waveform}
          onChange={(e) => setWaveform(e.target.value as any)}
          className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="sawtooth">Sawtooth</option>
          <option value="triangle">Triangle</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">
          Frequency: {frequency} Hz
        </label>
        <input
          type="range"
          min="20"
          max="20000"
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <p className="font-semibold mb-2">ADSR Control (Attack/Decay via XY Pad)</p>
        <div
          ref={xyPadRef}
          onMouseDown={onMouseDownXY}
          className="w-52 h-52 border border-gray-500 mx-auto relative select-none rounded-lg bg-gray-700"
        >
          {/* Visual Indicator */}
          <div
            style={{
              left: `${(attack / 2) * 100}%`,
              top: `${(decay / 2) * 100}%`,
            }}
            className="absolute w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
          />
        </div>
        <p className="mt-2 text-sm">Attack: {attack.toFixed(2)}s, Decay: {decay.toFixed(2)}s</p>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">
          Sustain: {sustain.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={sustain}
          onChange={(e) => setSustain(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">
          Release: {release.toFixed(2)}s
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.01"
          value={release}
          onChange={(e) => setRelease(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">
          Duration: {duration}s
        </label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">
          Bit Depth: {bitDepth} bits
        </label>
        <input
          type="range"
          min="8"
          max="32"
          step="8"
          value={bitDepth}
          onChange={(e) => setBitDepth(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <button
        onClick={generateSound}
        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-full mb-4"
      >
        Generate Sound Bytecode
      </button>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => playSound(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Start (Loop)
        </button>
        <button
          onClick={stopSound}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Stop
        </button>
        <button
          onClick={() => playSound(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Tap (One-shot)
        </button>
      </div>

      {generatedHex && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h4 className="font-bold mb-2">Generated Sound Bytecode:</h4>
          <div className="p-2 bg-gray-900 rounded-md text-green-400 font-mono text-sm break-all">
            {generatedHex}
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg bg-gray-800">
        <h4 className="font-bold mb-2">Waveform Preview</h4>
        <canvas ref={canvasRef} width={300} height={100} className="border border-gray-500 rounded-md bg-white" />
      </div>
    </div>
  );
};

export default SynthController;
