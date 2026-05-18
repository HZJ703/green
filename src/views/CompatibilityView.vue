<template>
  <main class="compatibility-page">
    <section class="compatibility-card">
      <p class="eyebrow">Ben Cao Ji</p>
      <h1>配伍关系</h1>
      <p class="description">该模块用于展示中药配伍关系与关联结构，功能建设中</p>
      <RouterLink class="back-link" to="/">返回首页</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.compatibility-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px 20px;
  color: #f7fff7;
  background:
    radial-gradient(circle at 24% 18%, rgba(166, 236, 196, 0.32), transparent 28%),
    radial-gradient(circle at 76% 72%, rgba(87, 196, 165, 0.28), transparent 34%),
    linear-gradient(135deg, #2f9178 0%, #1c765f 52%, #155c4d 100%);
}

.compatibility-card {
  width: min(620px, 100%);
  padding: 44px;
  border: 1px solid rgba(203, 247, 218, 0.38);
  border-radius: 28px;
  background: rgba(17, 104, 86, 0.46);
  box-shadow: 0 24px 70px rgba(7, 70, 56, 0.24);
  backdrop-filter: blur(18px);
}

.eyebrow {
  margin: 0 0 14px;
  color: #d8f6c7;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 4.4rem);
  line-height: 1;
  letter-spacing: 0;
}

.description {
  margin: 22px 0 32px;
  color: rgba(244, 255, 243, 0.84);
  font-size: 1.08rem;
  line-height: 1.8;
}

.back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 22px;
  border: 1px solid rgba(218, 245, 173, 0.58);
  border-radius: 999px;
  color: #f5ffe2;
  font-weight: 700;
  text-decoration: none;
  background: rgba(222, 248, 180, 0.12);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.back-link:hover {
  transform: translateY(-2px);
  border-color: rgba(224, 255, 190, 0.9);
  background: rgba(222, 248, 180, 0.2);
}

@media (max-width: 640px) {
  .compatibility-card {
    padding: 32px 24px;
    border-radius: 22px;
  }
}
</style>
