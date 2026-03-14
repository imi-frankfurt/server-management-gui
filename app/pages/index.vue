<template>
    <UPageHero
      title="IMI Tool - Login"
      description="Drücken Sie den Login-Button unten, um sich mit Ihrem Keycloak-Konto anzumelden."
      :links="[{
        label: 'Login',
        to: '/login',
        target: '_blank',
        trailingIcon: 'i-lucide-arrow-right',
        size: 'xl'
      }]"
    />
</template>

<script setup>
await navigateTo('/login', { redirectCode: 302 })
</script>