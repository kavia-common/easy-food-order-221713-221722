<template>
  <section class="settings">
    <header class="header">
      <h1 class="title">Notifications</h1>
      <p class="subtitle">
        Manage push notifications for special festival offers.
      </p>
    </header>

    <article class="card">
      <h2 class="card-title">Special Festival Offers</h2>
      <p class="consent">
        By turning on notifications, you agree to receive limited, relevant messages about special festival promotions from this app.
        You can change this anytime in Settings or your browser site permissions.
      </p>

      <NotificationsToggle />

      <div class="info" role="note">
        Notes:
        <ul>
          <li>Status reflects your browser permissions.</li>
          <li>If notifications are blocked, enable them in your browser settings for this site.</li>
          <li>We only send occasional, high-value offers. No spam.</li>
        </ul>
      </div>
    </article>
  </section>
</template>

<script lang="ts" setup>
import NotificationsToggle from '@/components/NotificationsToggle.vue';
</script>

<style scoped>
.settings {
  padding: 1rem;
  max-width: 920px;
  margin: 0 auto;
}
.header {
  margin-bottom: 1rem;
}
.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}
.subtitle {
  font-size: 0.95rem;
  color: #4b5563;
}
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(37,99,235,0.08);
  border: 1px solid #e5e7eb;
}
.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}
.consent {
  font-size: 0.95rem;
  color: #374151;
  margin-bottom: 0.75rem;
}
.info {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #4b5563;
}
.info ul {
  list-style: disc;
  margin-left: 1.25rem;
}
</style>
