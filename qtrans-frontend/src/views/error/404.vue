<template>
  <section class="error-page">
    <h1>404</h1>
    <p>页面不存在</p>
    <RouterLink to="/dashboard">返回首页</RouterLink>
  </section>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 8px;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 56px;
  color: #155dfc;
}

a {
  color: #155dfc;
}
</style>
