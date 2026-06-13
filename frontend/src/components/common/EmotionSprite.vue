<template>
  <span
    class="emotion-sprite"
    :class="[`emotion-sprite--${type}`, `emotion-sprite--${state}`]"
    :style="{ '--sprite-size': normalizedSize }"
    aria-hidden="true"
  >
    <span class="sprite-body">
      <span v-if="type === 'listening'" class="listening-ripple listening-ripple--one"></span>
      <span v-if="type === 'listening'" class="listening-ripple listening-ripple--two"></span>

      <span v-if="type === 'curious'" class="curious-drop curious-drop--one"></span>
      <span v-if="type === 'curious'" class="curious-drop curious-drop--two"></span>

      <span v-if="type === 'bloom'" class="bloom-petal bloom-petal--top"></span>
      <span v-if="type === 'bloom'" class="bloom-petal bloom-petal--right"></span>
      <span v-if="type === 'bloom'" class="bloom-petal bloom-petal--bottom"></span>
      <span v-if="type === 'bloom'" class="bloom-petal bloom-petal--left"></span>

      <span class="sprite-eye sprite-eye--left"></span>
      <span class="sprite-eye sprite-eye--right"></span>
      <span class="sprite-mouth"></span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'listening'
  },
  state: {
    type: String,
    default: 'idle'
  },
  size: {
    type: [Number, String],
    default: 96
  }
})

const normalizedSize = computed(() => (
  typeof props.size === 'number' ? `${props.size}px` : props.size
))
</script>

<style scoped>
.emotion-sprite {
  position: relative;
  display: inline-grid;
  width: var(--sprite-size);
  height: var(--sprite-size);
  place-items: center;
  flex: none;
}

.sprite-body {
  position: relative;
  display: block;
  width: 74%;
  height: 68%;
  transform-origin: center;
}

.sprite-eye {
  position: absolute;
  z-index: 3;
  width: 5%;
  height: 6%;
  border-radius: 999px;
  background: rgba(63, 73, 67, 0.78);
}

.sprite-eye--left {
  left: 35%;
  top: 43%;
}

.sprite-eye--right {
  right: 35%;
  top: 43%;
}

.sprite-mouth {
  position: absolute;
  z-index: 3;
  left: 41%;
  top: 56%;
  width: 18%;
  height: 10%;
  border-bottom: 2px solid rgba(63, 73, 67, 0.62);
  border-radius: 0 0 999px 999px;
}

.emotion-sprite--listening .sprite-body {
  border-radius: 58% 42% 48% 52% / 54% 48% 52% 46%;
  background:
    radial-gradient(circle at 34% 25%, rgba(255, 255, 255, 0.86), transparent 26%),
    #fff9e6;
  box-shadow:
    inset -4px -6px 12px rgba(255, 235, 153, 0.36),
    0 12px 26px rgba(255, 235, 153, 0.2);
  animation: listeningBreath 3.2s ease-in-out infinite;
}

.listening-ripple {
  position: absolute;
  inset: -18%;
  z-index: -1;
  border: 2px solid rgba(255, 235, 153, 0.42);
  border-radius: 58% 42% 48% 52% / 54% 48% 52% 46%;
  opacity: 0;
}

.listening-ripple--one {
  animation: listeningRipple 2.4s ease-out infinite;
}

.listening-ripple--two {
  animation: listeningRipple 2.4s ease-out 0.8s infinite;
}

.emotion-sprite--curious .sprite-body {
  border-radius: 58% 42% 60% 40% / 52% 62% 38% 48%;
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.76), transparent 24%),
    #e6f7ff;
  box-shadow:
    inset -5px -6px 12px rgba(179, 229, 255, 0.42),
    0 12px 28px rgba(179, 229, 255, 0.2);
  animation: curiousWobble 4s ease-in-out infinite;
}

.emotion-sprite--curious .sprite-eye {
  animation: curiousLook 3.4s ease-in-out infinite;
}

.curious-drop {
  position: absolute;
  border-radius: 62% 38% 58% 42% / 58% 40% 60% 42%;
  background: #b3e5ff;
  opacity: 0.72;
}

.curious-drop--one {
  right: -14%;
  top: 6%;
  width: 17%;
  height: 17%;
  animation: dropletFloat 5s ease-in-out infinite;
}

.curious-drop--two {
  left: -12%;
  bottom: 12%;
  width: 12%;
  height: 12%;
  animation: dropletFloat 4.2s ease-in-out 0.4s infinite reverse;
}

.emotion-sprite--bloom .sprite-body {
  width: 62%;
  height: 62%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.72), transparent 24%),
    #ffe6eb;
  box-shadow:
    inset -4px -6px 12px rgba(255, 179, 193, 0.4),
    0 14px 30px rgba(255, 179, 193, 0.22);
  animation: bloomBounce 2.8s ease-in-out infinite;
}

.emotion-sprite--bloom .sprite-mouth {
  top: 57%;
  height: 14%;
  border-bottom-width: 3px;
}

.bloom-petal {
  position: absolute;
  z-index: -1;
  width: 52%;
  height: 52%;
  border-radius: 58% 42% 54% 46% / 62% 45% 55% 38%;
  background: #ffb3c1;
  opacity: 0.82;
}

.bloom-petal--top {
  left: 24%;
  top: -35%;
}

.bloom-petal--right {
  right: -35%;
  top: 24%;
  transform: rotate(90deg);
}

.bloom-petal--bottom {
  left: 24%;
  bottom: -35%;
  transform: rotate(180deg);
}

.bloom-petal--left {
  left: -35%;
  top: 24%;
  transform: rotate(270deg);
}

.emotion-sprite--speaking .sprite-body,
.emotion-sprite--recording .sprite-body,
.emotion-sprite--generating .sprite-body {
  animation-duration: 1.45s;
}

@keyframes listeningBreath {
  0%,
  100% {
    transform: scale(0.96);
  }

  50% {
    transform: scale(1.04);
  }
}

@keyframes listeningRipple {
  0% {
    opacity: 0.58;
    transform: scale(0.8);
  }

  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@keyframes curiousWobble {
  0%,
  100% {
    border-radius: 58% 42% 60% 40% / 52% 62% 38% 48%;
    transform: rotate(-2deg);
  }

  50% {
    border-radius: 45% 55% 48% 52% / 58% 42% 58% 42%;
    transform: rotate(2deg) translateY(-2px);
  }
}

@keyframes curiousLook {
  0%,
  100% {
    transform: translateX(-2px);
  }

  50% {
    transform: translateX(2px);
  }
}

@keyframes dropletFloat {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-8deg);
  }

  50% {
    transform: translate3d(4px, -7px, 0) rotate(9deg);
  }
}

@keyframes bloomBounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  45% {
    transform: translateY(-5px) scale(1.04);
  }

  62% {
    transform: translateY(1px) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sprite-body,
  .sprite-eye,
  .listening-ripple,
  .curious-drop {
    animation: none;
  }
}
</style>
