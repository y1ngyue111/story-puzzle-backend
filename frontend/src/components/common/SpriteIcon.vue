<template>
  <span
    class="sprite-icon"
    :class="[`sprite-icon--${type}`, { 'sprite-icon--active': active }]"
    :style="spriteStyle"
    aria-hidden="true"
  >
    <span v-if="type === 'sparkle'" class="sprite-sparkle">
      <span class="sprite-eye sprite-eye--left"></span>
      <span class="sprite-eye sprite-eye--right"></span>
    </span>

    <span v-else-if="type === 'lock'" class="sprite-lock">
      <span class="sprite-eye sprite-eye--left"></span>
      <span class="sprite-eye sprite-eye--right"></span>
      <span class="sprite-lock-mouth"></span>
    </span>

    <span v-else-if="type === 'home'" class="sprite-home">
      <span class="sprite-home-leaf sprite-home-leaf--left"></span>
      <span class="sprite-home-leaf sprite-home-leaf--right"></span>
      <span class="sprite-home-soil"></span>
    </span>

    <span v-else-if="type === 'confetti'" class="sprite-confetti">
      <span class="sprite-eye sprite-eye--left"></span>
      <span class="sprite-eye sprite-eye--right"></span>
    </span>

    <span v-else-if="type === 'leaf'" class="sprite-leaf"></span>

    <span v-else-if="type === 'cloud'" class="sprite-cloud">
      <span class="sprite-eye sprite-eye--left"></span>
      <span class="sprite-eye sprite-eye--right"></span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'sparkle'
  },
  size: {
    type: [Number, String],
    default: 28
  },
  color: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: false
  }
})

const spriteStyle = computed(() => ({
  '--sprite-size': typeof props.size === 'number' ? `${props.size}px` : props.size,
  '--sprite-color': props.color || undefined
}))
</script>

<style scoped>
.sprite-icon {
  position: relative;
  display: inline-grid;
  width: var(--sprite-size);
  height: var(--sprite-size);
  place-items: center;
  flex: none;
}

.sprite-icon > span {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

.sprite-eye {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(47, 59, 53, 0.68);
}

.sprite-eye--left {
  left: 36%;
  top: 43%;
}

.sprite-eye--right {
  right: 36%;
  top: 43%;
}

.sprite-sparkle {
  background: var(--sprite-color, #ffd86f);
  clip-path: polygon(50% 0%, 62% 36%, 100% 50%, 62% 64%, 50% 100%, 38% 64%, 0% 50%, 38% 36%);
  animation: spriteSparkleBreath 2.6s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(216, 165, 53, 0.16));
}

.sprite-lock {
  border-radius: 45% 55% 48% 52% / 58% 42% 58% 42%;
  background: var(--sprite-color, #ffb2aa);
  box-shadow:
    inset -2px -3px 6px rgba(126, 77, 70, 0.09),
    0 5px 12px rgba(255, 138, 118, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sprite-lock-mouth {
  position: absolute;
  left: 32%;
  top: 57%;
  width: 36%;
  height: 13%;
  border-bottom: 2px solid rgba(89, 67, 63, 0.56);
  border-radius: 0 0 999px 999px;
}

.sprite-icon--lock.sprite-icon--active .sprite-lock {
  transform: scale(0.92);
  box-shadow:
    inset -2px -3px 6px rgba(126, 77, 70, 0.08),
    0 0 0 5px rgba(142, 210, 167, 0.24);
}

.sprite-icon--lock.sprite-icon--active .sprite-eye {
  height: 1px;
  border-radius: 999px;
}

.sprite-home {
  display: grid;
  place-items: end center;
}

.sprite-home-leaf {
  position: absolute;
  top: 15%;
  width: 42%;
  height: 42%;
  background: var(--sprite-color, #8ed2a7);
  box-shadow: inset -2px -2px 5px rgba(44, 102, 70, 0.1);
}

.sprite-home-leaf--left {
  left: 20%;
  border-radius: 65% 35% 58% 42% / 55% 42% 58% 45%;
  transform: rotate(-28deg);
}

.sprite-home-leaf--right {
  right: 20%;
  border-radius: 35% 65% 42% 58% / 42% 55% 45% 58%;
  transform: rotate(28deg);
}

.sprite-home-soil {
  position: absolute;
  bottom: 15%;
  left: 22%;
  width: 56%;
  height: 22%;
  border-radius: 55% 45% 50% 50% / 60% 55% 45% 40%;
  background: #e5c494;
}

.sprite-icon--home:hover .sprite-home-leaf,
.sprite-icon--home.sprite-icon--active .sprite-home-leaf {
  transform: rotate(12deg) scale(1.08);
}

.sprite-icon--home:hover .sprite-home-leaf--left,
.sprite-icon--home.sprite-icon--active .sprite-home-leaf--left {
  transform: rotate(-12deg) scale(1.08);
}

.sprite-confetti {
  border-radius: 40% 60% 35% 65% / 60% 45% 55% 40%;
  background: var(--sprite-color, #fed7ce);
  box-shadow:
    inset -2px -2px 6px rgba(0, 0, 0, 0.05),
    0 6px 14px rgba(77, 103, 91, 0.08);
  animation: spriteConfettiWobble 4s ease-in-out infinite;
}

.sprite-leaf {
  border-radius: 80% 12% 76% 18% / 70% 18% 82% 24%;
  background: var(--sprite-color, #9bd4aa);
  transform: rotate(-24deg);
  opacity: 0.72;
  animation: spriteFloat 8s ease-in-out infinite;
}

.sprite-cloud {
  border-radius: 58% 42% 54% 46% / 50% 58% 42% 50%;
  background: var(--sprite-color, rgba(255, 255, 255, 0.82));
  box-shadow:
    10px 2px 0 -2px var(--sprite-color, rgba(255, 255, 255, 0.82)),
    -8px 4px 0 -3px var(--sprite-color, rgba(255, 255, 255, 0.82));
  animation: spriteFloat 9s ease-in-out infinite reverse;
}

@keyframes spriteSparkleBreath {
  0%,
  100% {
    opacity: 0.68;
    transform: scale(0.94) rotate(-12deg);
  }

  50% {
    opacity: 1;
    transform: scale(1.16) rotate(15deg);
  }
}

@keyframes spriteConfettiWobble {
  0%,
  100% {
    border-radius: 40% 60% 35% 65% / 60% 45% 55% 40%;
    transform: rotate(0deg) translateY(0);
  }

  50% {
    border-radius: 56% 44% 42% 58% / 48% 58% 42% 52%;
    transform: rotate(8deg) translateY(-4px);
  }
}

@keyframes spriteFloat {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-8deg);
  }

  50% {
    transform: translate3d(6px, -8px, 0) rotate(7deg);
  }
}
</style>
