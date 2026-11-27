<template>
  <div class="explore-image-list-field">
    <div v-if="value.length > 0" class="image-grid">
      <div v-for="(image, index) in value" :key="image.url + '-' + index" class="image-cell">
        <img :src="image.url" :alt="image.url">
        <div class="image-cell-meta">
          {{ image.width }} × {{ image.height }} · {{ image.mime }}
        </div>
        <div v-if="showDetail" class="image-cell-detail">
          <el-switch
            :value="image.showInDetail !== false"
            active-text="详情展示"
            @change="toggleDetail(index, $event)"
          />
        </div>
        <div class="image-cell-actions">
          <el-button type="text" icon="el-icon-top" @click="move(index, -1)" />
          <el-button type="text" icon="el-icon-bottom" @click="move(index, 1)" />
          <el-button type="text" icon="el-icon-delete" style="color: #f56c6c" @click="remove(index)" />
        </div>
      </div>
    </div>
    <image-field
      v-if="value.length < max"
      :value="null"
      :allowed-hosts="allowedHosts"
      @input="addImage"
    />
    <div class="image-list-tip">
      已上传 {{ value.length }} / {{ max }} 张；第 1 张作为列表封面。1/2/3/4/5～9 张将按不同布局展示。
    </div>
    <div v-if="showDetail" class="image-list-tip">
      第 1 张始终作为卡片封面，关闭“详情展示”不影响封面；详情图集只包含开启的图片。
    </div>
  </div>
</template>

<script>
import ImageField from './ImageField'

export default {
  name: 'ExploreImageListField',
  components: { ImageField },
  props: {
    value: {
      type: Array,
      default: () => []
    },
    max: {
      type: Number,
      default: 9
    },
    allowedHosts: {
      type: Array,
      default: () => []
    },
    /**
     * 是否开放每图“详情展示”运营配置（仅专题图集，文章图集不开放）
     */
    showDetail: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    addImage(image) {
      if (!image) return
      if (this.value.length >= this.max) {
        this.$modal.msgError('最多上传 ' + this.max + ' 张图片')
        return
      }
      const nextImage = this.showDetail
        ? { ...image, showInDetail: image.showInDetail !== false }
        : image
      const next = this.value.concat([nextImage])
      this.$emit('input', next)
    },
    toggleDetail(index, visible) {
      const next = this.value.slice()
      next[index] = { ...next[index], showInDetail: visible }
      this.$emit('input', next)
    },
    remove(index) {
      const next = this.value.slice()
      next.splice(index, 1)
      this.$emit('input', next)
    },
    move(index, offset) {
      const target = index + offset
      if (target < 0 || target >= this.value.length) return
      const next = this.value.slice()
      const [current] = next.splice(index, 1)
      next.splice(target, 0, current)
      this.$emit('input', next)
    }
  }
}
</script>

<style scoped>
.explore-image-list-field {
  width: 100%;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}
.image-cell {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 6px;
  background: #fafafa;
}
.image-cell img {
  width: 100%;
  height: 84px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}
.image-cell-meta {
  font-size: 11px;
  color: #606266;
  margin-top: 4px;
}
.image-cell-detail {
  margin-top: 4px;
  font-size: 11px;
}
.image-cell-detail ::v-deep .el-switch__label {
  font-size: 11px;
}
.image-cell-actions {
  text-align: right;
}
.image-list-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
</style>
