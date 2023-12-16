<script lang="ts">
    import { onMount } from "svelte";
  import Panel from "../components/panel.svelte";
  import type { WadDirEntry } from "../lib/wad-reader";

  export let lump: Uint8Array;
  export let dirEntry: WadDirEntry;

  let audioElement: HTMLAudioElement;
  let sampleRate: number = 0;
  let sampleCount: number = 0;
  let samples: Uint8Array;
  let isPcSpeaker = false;

  let ctx: AudioContext;

  function readSound(lump: Uint8Array, audioElement: HTMLAudioElement) {
    let index = 0;

    const read16 = () => {
      const a = lump[index++];
      const b = lump[index++];
      return a + (b << 8);
    };

    const read32 = () => {
      const a = lump[index++];
      const b = lump[index++];
      const c = lump[index++];
      const d = lump[index++];
      return a + (b << 8) + (c << 16) + (d << 24);
    };

    // header
    const format = read16();
    isPcSpeaker = format === 0;
    if (isPcSpeaker) {
      sampleRate = 140;
      sampleCount = read16();
      samples = lump.slice(index, index + sampleCount);
      return;
    }

    if (!audioElement) {
      return;
    }

    sampleRate = read16();
    sampleCount = read32();

    // skip over 16 pad bytes
    index += 16;
    
    // copy the samples
    samples = lump.slice(index, index + sampleCount);
    
    // write the wav header
    const wav = new Uint8Array(44 + sampleCount + 32);
    let wavIndex = 0;
    
    const write32 = (num: number) => {
      wav[wavIndex++] = num & 0xFF;
      wav[wavIndex++] = (num & 0xFF00) >> 8;
      wav[wavIndex++] = (num & 0xFF0000) >> 16;
      wav[wavIndex++] = (num & 0xFF000000) >> 24;
    };

    wav[wavIndex++] = 'R'.charCodeAt(0);
    wav[wavIndex++] = 'I'.charCodeAt(0);
    wav[wavIndex++] = 'F'.charCodeAt(0);
    wav[wavIndex++] = 'F'.charCodeAt(0);

    // size - 32
    const size = (44 + sampleCount) - 8;
    write32(size);

    wav[wavIndex++] = 'W'.charCodeAt(0);
    wav[wavIndex++] = 'A'.charCodeAt(0);
    wav[wavIndex++] = 'V'.charCodeAt(0);
    wav[wavIndex++] = 'E'.charCodeAt(0);

    // format chunk marker
    wav[wavIndex++] = 'f'.charCodeAt(0);
    wav[wavIndex++] = 'm'.charCodeAt(0);
    wav[wavIndex++] = 't'.charCodeAt(0);
    wav[wavIndex++] = 32;

    // length of stuff above
    wav[wavIndex++] = 16;
    wav[wavIndex++] = 0;
    wav[wavIndex++] = 0;
    wav[wavIndex++] = 0;
    
    // type of format (1 = PCM)
    wav[wavIndex++] = 1;
    wav[wavIndex++] = 0;
    
    // number of channels
    wav[wavIndex++] = 1;
    wav[wavIndex++] = 0;
    
    // sample rate
    write32(sampleRate);
    
    // (Sample Rate * BitsPerSample * Channels) / 8.
    // for us Channels = 1 and BitsPerSample = 8, so (Sample Rate * 8) / 8 = Sample Rate
    write32(sampleRate);
    
    // (BitsPerSample * Channels) / 8
    wav[wavIndex++] = 1
    wav[wavIndex++] = 0
    
    // bits per sample
    wav[wavIndex++] = 8
    wav[wavIndex++] = 0
    
    // data chunk header
    wav[wavIndex++] = 'd'.charCodeAt(0);
    wav[wavIndex++] = 'a'.charCodeAt(0);
    wav[wavIndex++] = 't'.charCodeAt(0);
    wav[wavIndex++] = 'a'.charCodeAt(0);
    
    // size of the data section
    write32(sampleCount - 1);

    // write pad bytes
    for (let i = 0; i < 16; i++) {
      wav[wavIndex++] = samples[0];
    }

    for (let i = 0; i < sampleCount; i++) {
      wav[wavIndex++] = samples[i];
    }

    // write pad bytes
    for (let i = 0; i < 16; i++) {
      wav[wavIndex++] = samples[samples.length - 1];
    }
    
    const blob = new Blob([wav], { type: 'audio/wav' });
    audioElement.src = window.URL.createObjectURL(blob);
  }

  function playPcSpeaker() {
    // use the audio API to emulate a pc speaker
    ctx = new AudioContext();

    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.3;

    const osc = ctx.createOscillator();
    osc.connect(gainNode)
    osc.type = 'square';
    osc.start();

    const noteMap = [
      0, // 0 = silence
      175.00, 180.02, 185.01, 190.02, 196.02, 202.02, 208.01, 214.02,
      220.02, 226.02, 233.04, 240.02, 247.03, 254.03, 262.00, 269.03,
      277.03, 285.04, 294.03, 302.07, 311.04, 320.05, 330.06, 339.06,
      349.08, 359.06, 370.09, 381.08, 392.10, 403.10, 415.01, 427.05,
      440.12, 453.16, 466.08, 480.15, 494.07, 508.16, 523.09, 539.16,
      554.19, 571.17, 587.19, 604.14, 622.09, 640.11, 659.21, 679.10,
      698.17, 719.21, 740.18, 762.41, 784.47, 807.29, 831.48, 855.32,
      880.57, 906.67, 932.17, 960.69, 988.55, 1017.20, 1046.64, 1077.85,
      1109.93, 1141.79, 1175.54, 1210.12, 1244.19, 1281.61, 1318.43, 1357.42,
      1397.16, 1439.30, 1480.37, 1523.85, 1569.97, 1614.58, 1661.81, 1711.87,
      1762.45, 1813.34, 1864.34, 1921.38, 1975.46, 2036.14, 2093.29, 2157.64,
      2217.80, 2285.78, 2353.41, 2420.24, 2490.98, 2565.97, 2639.77,
    ];

    let lastTime = 0;
    for (let i = 0; i < samples.length; i++) {
      // each sample is 1/40th of a second
      const sampleTime = i/140;
      const sample = samples[i];
      osc.frequency.setValueAtTime(noteMap[sample], ctx.currentTime + sampleTime);
      lastTime = ctx.currentTime + sampleTime;
    }

    osc.stop(lastTime);
  }

  onMount(() => {
    return () => {
      if (ctx) {
        ctx.close();
      }
    };
  });

  $: readSound(lump, audioElement);
</script>

<Panel title={dirEntry.name}>
  {#if isPcSpeaker}
    <button type="button" on:click={playPcSpeaker}>Play</button>
  {:else}
    <audio bind:this={audioElement} controls></audio>
    <div>{sampleCount} samples at {sampleRate}Hz</div>
  {/if}
</Panel>