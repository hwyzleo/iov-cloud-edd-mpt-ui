<template>
  <div class="sso-callback">
    <div class="sso-callback__card">
      <h3>EIAM 单点登录</h3>
      <p v-if="loading">正在完成登录，请稍候…</p>
      <p v-else-if="errorMessage" class="sso-callback__error">{{ errorMessage }}</p>
      <el-button v-if="errorMessage" type="primary" size="medium" @click="backToLogin">返回登录页</el-button>
    </div>
  </div>
</template>

<script>
import { ssoToken } from '@/api/login'
import { setToken, setExpiresIn } from '@/utils/auth'

const CLIENT_ID = 'mpt'
const STATE_KEY = 'eiam_sso_state'

export default {
  name: 'SsoCallback',
  data() {
    return {
      loading: true,
      errorMessage: ''
    }
  },
  created() {
    this.handleCallback()
  },
  methods: {
    async handleCallback() {
      const query = this.$route.query || {}
      const code = query.code
      const state = query.state
      const expectedState = sessionStorage.getItem(STATE_KEY)
      sessionStorage.removeItem(STATE_KEY)

      if (!code) {
        this.fail('未获取到授权码，请重新发起单点登录')
        return
      }
      if (expectedState && state !== expectedState) {
        this.fail('登录状态校验失败（state 不匹配），请重新发起单点登录')
        return
      }

      try {
        const response = await ssoToken(code, CLIENT_ID, this.redirectUri())
        const data = response.data || {}
        if (!data.access_token) {
          this.fail('单点登录失败：未返回访问令牌')
          return
        }
        setToken(data.access_token)
        setExpiresIn(data.expires_in)
        this.$store.commit('SET_TOKEN', data.access_token)
        this.$store.commit('SET_EXPIRES_IN', data.expires_in)
        const info = await this.$store.dispatch('GetInfo')
        this.loading = false
        this.$router.replace({ path: info && info.defaultRoute ? info.defaultRoute : '/' })
      } catch (error) {
        this.fail(this.resolveErrorMessage(error))
      }
    },
    redirectUri() {
      return window.location.origin + '/sso/callback'
    },
    fail(message) {
      this.loading = false
      this.errorMessage = message
    },
    resolveErrorMessage(error) {
      const message = (error && (error.message || error.msg)) || ''
      if (message) {
        return message
      }
      return '单点登录失败，请联系管理员或使用账号密码登录'
    },
    backToLogin() {
      this.$router.replace('/login')
    }
  }
}
</script>

<style scoped>
.sso-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f7fa;
}

.sso-callback__card {
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 360px;
  text-align: center;
}

.sso-callback__error {
  color: #f56c6c;
  margin-bottom: 16px;
}
</style>
