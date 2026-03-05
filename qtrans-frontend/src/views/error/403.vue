<template>
  <section class="error-page">
    <h1>403</h1>
    <p>无权限访问该页面</p>
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
  color: #dc2626;
}

a {
  color: #155dfc;
}
</style>
