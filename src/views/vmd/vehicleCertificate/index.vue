<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true">
      <el-form-item label="车架号" prop="vin">
        <el-input
          v-model="queryParams.vin"
          placeholder="请输入车架号"
          clearable
          style="width: 190px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备SN" prop="deviceSn">
        <el-input
          v-model="queryParams.deviceSn"
          placeholder="请输入设备SN"
          clearable
          style="width: 170px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="证书序列号" prop="certSn">
        <el-input
          v-model="queryParams.certSn"
          placeholder="请输入证书序列号"
          clearable
          style="width: 170px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="请求ID" prop="requestId">
        <el-input
          v-model="queryParams.requestId"
          placeholder="请输入业务请求ID"
          clearable
          style="width: 170px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="证书状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来源系统" prop="source">
        <el-select v-model="queryParams.source" placeholder="请选择来源" clearable style="width: 160px">
          <el-option
            v-for="item in sourceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['vmd:security:vehicleCertificate:compensate']"
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleCompensate"
        >人工补申请
        </el-button>
      </el-col>
      <right-toolbar :show-search.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="certificateList">
      <el-table-column label="车架号" fixed="left" min-width="180" prop="vin" show-overflow-tooltip />
      <el-table-column label="设备SN" prop="deviceSn" min-width="150" show-overflow-tooltip />
      <el-table-column label="设备类别" prop="deviceCategory" align="center" width="90" />
      <el-table-column label="证书序列号" prop="certSn" min-width="160" show-overflow-tooltip />
      <el-table-column label="证书Profile" prop="certificateProfile" align="center" width="130" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" align="center" width="130">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源系统" prop="sourceSystem" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ sourceLabel(scope.row.sourceSystem) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="业务请求ID" prop="requestId" min-width="180" show-overflow-tooltip />
      <el-table-column label="有效期至" prop="notAfter" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.notAfter, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="签发时间" prop="issuedAt" align="center" width="140">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.issuedAt, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后操作人" prop="lastOperator" align="center" width="110" show-overflow-tooltip />
      <el-table-column label="失败原因" prop="failReason" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" align="center" fixed="right" width="400" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['vmd:security:vehicleCertificate:query']"
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
          >详情
          </el-button>
          <el-button
            v-hasPermi="['vmd:security:vehicleCertificate:compensate']"
            size="mini"
            type="text"
            icon="el-icon-refresh"
            :disabled="!canReconcile(scope.row.status)"
            @click="handleReconcile(scope.row)"
          >对账
          </el-button>
          <el-button
            v-hasPermi="['vmd:security:vehicleCertificate:confirm']"
            size="mini"
            type="text"
            icon="el-icon-finished"
            :disabled="!canConfirm(scope.row.status)"
            @click="handleConfirmInstalled(scope.row)"
          >安装补录
          </el-button>
          <el-button
            v-hasPermi="['vmd:security:vehicleCertificate:query']"
            size="mini"
            type="text"
            icon="el-icon-download"
            :disabled="!canQuery(scope.row.status)"
            @click="handleQueryCert(scope.row)"
          >获取证书
          </el-button>
          <el-button
            v-hasPermi="['vmd:security:vehicleCertificate:compensate']"
            size="mini"
            type="text"
            icon="el-icon-refresh-right"
            :disabled="!canReissue(scope.row.status)"
            @click="handleReissue(scope.row)"
          >重新签发
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 证书详情对话框 -->
    <el-dialog title="证书申请详情" :visible.sync="openDetail" width="900px" append-to-body>
      <div v-loading="loadingDetail" class="dialog-body" style="max-height: 60vh; overflow-y: auto;">
        <el-descriptions title="基本信息" :column="2" border size="small">
          <el-descriptions-item label="车架号">{{ detail.vin }}</el-descriptions-item>
          <el-descriptions-item label="设备SN">{{ detail.deviceSn }}</el-descriptions-item>
          <el-descriptions-item label="设备类别">{{ detail.deviceCategory }}</el-descriptions-item>
          <el-descriptions-item label="证书Profile">{{ detail.certificateProfile }}</el-descriptions-item>
          <el-descriptions-item label="证书状态">
            <el-tag :type="statusTagType(detail.status)" size="mini">{{ statusLabel(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源系统">{{ sourceLabel(detail.sourceSystem) }}</el-descriptions-item>
          <el-descriptions-item label="业务请求ID">{{ detail.requestId }}</el-descriptions-item>
          <el-descriptions-item label="MES原请求号">{{ detail.originalRequestId }}</el-descriptions-item>
          <el-descriptions-item label="PKI申请编号">{{ detail.pkiRequestId }}</el-descriptions-item>
          <el-descriptions-item label="证书序列号">{{ detail.certSn }}</el-descriptions-item>
          <el-descriptions-item label="CSR指纹(SHA-256)" :span="2">{{ detail.csrFingerprint }}</el-descriptions-item>
          <el-descriptions-item label="证书指纹(SHA-256)" :span="2">{{ detail.certificateFingerprint }}</el-descriptions-item>
          <el-descriptions-item label="Subject" :span="2">{{ detail.subject }}</el-descriptions-item>
          <el-descriptions-item label="Issuer" :span="2">{{ detail.issuer }}</el-descriptions-item>
          <el-descriptions-item label="有效期开始">{{ parseTime(detail.notBefore) }}</el-descriptions-item>
          <el-descriptions-item label="有效期结束">{{ parseTime(detail.notAfter) }}</el-descriptions-item>
          <el-descriptions-item label="签发时间">{{ parseTime(detail.issuedAt) }}</el-descriptions-item>
          <el-descriptions-item label="安装确认时间">{{ parseTime(detail.confirmedAt) }}</el-descriptions-item>
          <el-descriptions-item label="人工补偿原因" :span="2">{{ detail.compensationReason }}</el-descriptions-item>
          <el-descriptions-item label="关联工单号">{{ detail.ticketNo }}</el-descriptions-item>
          <el-descriptions-item label="最后操作人">{{ detail.lastOperator }}</el-descriptions-item>
          <el-descriptions-item label="最后操作时间">{{ parseTime(detail.lastOperationAt) }}</el-descriptions-item>
          <el-descriptions-item label="最近失败原因">{{ detail.failReason }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="修改时间">{{ parseTime(detail.modifyTime) }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin: 16px 0 8px; font-weight: bold;">操作审计时间线</div>
        <el-timeline v-if="detail.operations && detail.operations.length > 0">
          <el-timeline-item
            v-for="(op, index) in detail.operations"
            :key="index"
            :timestamp="parseTime(op.occurredAt)"
            placement="top"
          >
            <el-card shadow="never" :body-style="{ padding: '10px' }">
              <p style="margin: 0;">
                <el-tag size="mini">{{ actionLabel(op.action) }}</el-tag>
                <span style="margin-left: 8px;">操作人：{{ op.operatorName }}</span>
                <span v-if="op.result" style="margin-left: 8px;">结果：{{ op.result }}</span>
              </p>
              <p v-if="op.beforeStatus || op.afterStatus" style="margin: 6px 0 0; color: #909399;">
                状态：{{ statusLabel(op.beforeStatus) }} → {{ statusLabel(op.afterStatus) }}
              </p>
              <p v-if="op.reason" style="margin: 6px 0 0; color: #606266;">原因：{{ op.reason }}</p>
              <p v-if="op.ticketNo" style="margin: 6px 0 0; color: #606266;">工单号：{{ op.ticketNo }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无操作记录" :image-size="80" />
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openDetail = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 人工补申请对话框 -->
    <el-dialog title="人工补申请证书" :visible.sync="openCompensate" width="640px" append-to-body>
      <el-alert
        title="后台不生成设备密钥或CSR，CSR必须来自目标TBOX/安全芯片对应的受信工位回读结果；且CSR的Subject CN必须为设备HSM UID（由绑定关系解析，非设备SN），否则将因身份不一致被拒。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-form ref="compensateForm" :model="compensateForm" :rules="compensateRules" label-width="150px">
        <el-form-item label="车架号" prop="vin">
          <el-input v-model="compensateForm.vin" placeholder="请输入车架号" />
        </el-form-item>
        <el-form-item label="设备类别" prop="deviceCategory">
          <el-select v-model="compensateForm.deviceCategory" placeholder="请选择设备类别" style="width: 100%">
            <el-option
              v-for="item in deviceCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备SN" prop="deviceSn">
          <el-input v-model="compensateForm.deviceSn" placeholder="请输入设备SN" />
        </el-form-item>
        <el-form-item label="证书Profile" prop="certificateProfile">
          <el-select v-model="compensateForm.certificateProfile" placeholder="请选择证书Profile" style="width: 100%">
            <el-option
              v-for="item in profileOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="CSR(DER Base64)" prop="csrDerBase64">
          <el-input
            v-model="compensateForm.csrDerBase64"
            type="textarea"
            :rows="4"
            placeholder="请粘贴受信工位回读的CSR DER Base64编码"
          />
        </el-form-item>
        <el-form-item label="业务请求ID" prop="requestId">
          <el-input v-model="compensateForm.requestId" placeholder="可选，已存在时进入幂等比对" />
        </el-form-item>
        <el-form-item label="MES原请求号" prop="originalMesRequestId">
          <el-input v-model="compensateForm.originalMesRequestId" placeholder="可选，命中既有记录时引导对账" />
        </el-form-item>
        <el-form-item label="工厂编号" prop="facilityNo">
          <el-input v-model="compensateForm.facilityNo" placeholder="可选" />
        </el-form-item>
        <el-form-item label="产线代码" prop="lineCode">
          <el-input v-model="compensateForm.lineCode" placeholder="可选" />
        </el-form-item>
        <el-form-item label="工单号" prop="ticketNo">
          <el-input v-model="compensateForm.ticketNo" placeholder="可选" />
        </el-form-item>
        <el-form-item label="补偿原因" prop="reason">
          <el-input v-model="compensateForm.reason" type="textarea" :rows="2" placeholder="请输入人工补偿原因" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitting" @click="submitCompensate">确 定</el-button>
        <el-button @click="openCompensate = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 对账对话框 -->
    <el-dialog title="证书申请对账" :visible.sync="openReconcile" width="500px" append-to-body>
      <el-form ref="reconcileForm" :model="reconcileForm" label-width="100px">
        <el-form-item label="车架号">
          <span>{{ reconcileForm.vin }}</span>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="statusTagType(reconcileForm.status)" size="mini">{{ statusLabel(reconcileForm.status) }}</el-tag>
        </el-form-item>
        <el-form-item label="对账原因" prop="reason">
          <el-input v-model="reconcileForm.reason" type="textarea" :rows="2" placeholder="可选，将进入审计" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitting" @click="submitReconcile">确 定</el-button>
        <el-button @click="openReconcile = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 安装结果补录对话框 -->
    <el-dialog title="安装结果补录" :visible.sync="openConfirm" width="560px" append-to-body>
      <el-form ref="confirmForm" :model="confirmForm" :rules="confirmRules" label-width="120px">
        <el-form-item label="车架号">
          <span>{{ confirmForm.vin }}</span>
        </el-form-item>
        <el-form-item label="证书序列号" prop="certSn">
          <el-input v-model="confirmForm.certSn" placeholder="请输入证书序列号" />
        </el-form-item>
        <el-form-item label="设备SN" prop="deviceSn">
          <el-input v-model="confirmForm.deviceSn" placeholder="请输入设备SN" />
        </el-form-item>
        <el-form-item label="安装结果" prop="result">
          <el-radio-group v-model="confirmForm.result">
            <el-radio label="SUCCESS">成功</el-radio>
            <el-radio label="FAILED">失败</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="confirmForm.result === 'FAILED'" label="失败原因" prop="failReason">
          <el-input v-model="confirmForm.failReason" type="textarea" :rows="2" placeholder="请输入失败原因" />
        </el-form-item>
        <el-form-item label="工单号" prop="ticketNo">
          <el-input v-model="confirmForm.ticketNo" placeholder="必填" />
        </el-form-item>
        <el-form-item label="补录原因" prop="reason">
          <el-input v-model="confirmForm.reason" type="textarea" :rows="2" placeholder="必填" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitting" @click="submitConfirm">确 定</el-button>
        <el-button @click="openConfirm = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 重新签发/续期对话框 -->
    <el-dialog title="重新签发 / 续期" :visible.sync="openReissue" width="640px" append-to-body>
      <el-alert
        title="作废当前证书并以新有效期重新签发。CSR 不落库，请由设备侧重新提供（同公钥即续期，新公钥即换钥）。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-form ref="reissueForm" :model="reissueForm" :rules="reissueRules" label-width="120px">
        <el-form-item label="车架号">
          <span>{{ reissueForm.vin }}</span>
        </el-form-item>
        <el-form-item label="设备SN">
          <span>{{ reissueForm.deviceSn }}</span>
        </el-form-item>
        <el-form-item label="CSR(DER Base64)" prop="csrDerBase64">
          <el-input
            v-model="reissueForm.csrDerBase64"
            type="textarea"
            :rows="4"
            placeholder="请粘贴设备重新生成的 CSR（DER Base64）"
          />
        </el-form-item>
        <el-form-item label="工单号" prop="ticketNo">
          <el-input v-model="reissueForm.ticketNo" placeholder="必填" />
        </el-form-item>
        <el-form-item label="重签原因" prop="reason">
          <el-input v-model="reissueForm.reason" type="textarea" :rows="2" placeholder="必填，如：原证书有效期过短" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" :loading="submitting" @click="submitReissue">确 定</el-button>
        <el-button @click="openReissue = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 已签发证书内容对话框（供产线/售后手动注入设备） -->
    <el-dialog title="已签发证书内容" :visible.sync="openCertResult" width="900px" append-to-body>
      <el-alert
        title="以下为已签发的证书本体（公开信息，不含私钥）。VMD不长期保存证书本体，需要时请通过“获取证书”重新获取。"
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-descriptions :column="2" border size="small" style="margin-bottom: 16px;">
        <el-descriptions-item label="业务请求ID">{{ certResult.requestId }}</el-descriptions-item>
        <el-descriptions-item label="证书状态">
          <el-tag :type="statusTagType(certResult.status)" size="mini">{{ statusLabel(certResult.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="证书序列号">{{ certResult.certSn }}</el-descriptions-item>
        <el-descriptions-item label="颁发者">{{ certResult.issuer }}</el-descriptions-item>
        <el-descriptions-item label="有效期开始">{{ certResult.notBefore }}</el-descriptions-item>
        <el-descriptions-item label="有效期结束">{{ certResult.notAfter }}</el-descriptions-item>
        <el-descriptions-item label="证书指纹" :span="2">{{ certResult.fingerprint }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="certResultTab">
        <el-tab-pane label="PEM 证书" name="pem">
          <div style="margin-bottom: 8px;">
            <el-button size="mini" icon="el-icon-document-copy" @click="copyText(leafPem)">复制</el-button>
            <el-button size="mini" icon="el-icon-download" @click="downloadText(leafPem, certResult.certSn ? certResult.certSn + '.pem' : 'certificate.pem')">下载 .pem</el-button>
          </div>
          <el-input :value="leafPem" type="textarea" :rows="8" readonly />
        </el-tab-pane>
        <el-tab-pane label="DER (Base64)" name="der">
          <div style="margin-bottom: 8px;">
            <el-button size="mini" icon="el-icon-document-copy" @click="copyText(certResult.certificateDerBase64)">复制</el-button>
            <el-button size="mini" icon="el-icon-download" @click="downloadText(certResult.certificateDerBase64, certResult.certSn ? certResult.certSn + '.der.txt' : 'certificate.der.txt')">下载</el-button>
          </div>
          <el-input :value="certResult.certificateDerBase64" type="textarea" :rows="8" readonly />
        </el-tab-pane>
        <el-tab-pane v-if="chainPem" label="证书链 PEM" name="chain">
          <div style="margin-bottom: 8px;">
            <el-button size="mini" icon="el-icon-document-copy" @click="copyText(chainPem)">复制</el-button>
            <el-button size="mini" icon="el-icon-download" @click="downloadText(chainPem, certResult.certSn ? certResult.certSn + '.chain.pem' : 'chain.pem')">下载 .pem</el-button>
          </div>
          <el-input :value="chainPem" type="textarea" :rows="8" readonly />
        </el-tab-pane>
        <el-tab-pane v-if="fullChainPem" label="完整链 PEM" name="fullchain">
          <div style="margin-bottom: 8px;">
            <el-button size="mini" icon="el-icon-document-copy" @click="copyText(fullChainPem)">复制</el-button>
            <el-button size="mini" icon="el-icon-download" @click="downloadText(fullChainPem, certResult.certSn ? certResult.certSn + '.fullchain.pem' : 'fullchain.pem')">下载 .pem</el-button>
          </div>
          <el-input :value="fullChainPem" type="textarea" :rows="8" readonly />
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="openCertResult = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listVehicleCertificate,
  getVehicleCertificate,
  compensateVehicleCertificate,
  reconcileVehicleCertificate,
  confirmInstalledVehicleCertificate,
  queryVehicleCertificateBody,
  reissueVehicleCertificate
} from '@/api/vmd/vehicleCertificate'

export default {
  name: 'VehicleCertificate',
  data() {
    return {
      // 证书状态选项
      statusOptions: [
        { value: 'REQUESTED', label: '已请求', type: 'info' },
        { value: 'ISSUING', label: '签发中', type: 'warning' },
        { value: 'PENDING_RECONCILE', label: '待对账', type: 'warning' },
        { value: 'ISSUED_NOT_CONFIRMED', label: '已签发未确认', type: 'primary' },
        { value: 'ACTIVE', label: '已激活', type: 'success' },
        { value: 'INSTALL_FAILED', label: '安装失败', type: 'danger' },
        { value: 'SUPERSEDED', label: '已取代', type: 'info' },
        { value: 'REVOKED', label: '已吊销', type: 'danger' },
        { value: 'EXPIRED', label: '已过期', type: 'info' },
        { value: 'FAILED', label: '失败', type: 'danger' }
      ],
      // 来源系统选项
      sourceOptions: [
        { value: 'MES', label: 'MES' },
        { value: 'MPT_COMPENSATION', label: '人工补偿' }
      ],
      // 设备类别选项（当前仅 TBOX）
      deviceCategoryOptions: [
        { value: 'TBOX', label: 'TBOX' }
      ],
      // 证书Profile选项（后端白名单，当前仅 TBOX_TSP_CLIENT）
      profileOptions: [
        { value: 'TBOX_TSP_CLIENT', label: 'TBOX_TSP_CLIENT' }
      ],
      // 操作类型映射
      actionTypes: {
        COMPENSATE: '人工补申请',
        RECONCILE: '对账',
        CONFIRM_INSTALLED: '安装补录',
        QUERY: '获取证书',
        REISSUE: '重新签发'
      },
      // 遮罩层
      loading: true,
      // 详情遮罩层
      loadingDetail: false,
      // 提交中
      submitting: false,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 证书列表数据
      certificateList: [],
      // 详情数据
      detail: {},
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        requestId: undefined,
        vin: undefined,
        deviceSn: undefined,
        certSn: undefined,
        status: undefined,
        source: undefined
      },
      // 对话框显示控制
      openDetail: false,
      openCompensate: false,
      openReconcile: false,
      openConfirm: false,
      openReissue: false,
      // 已签发证书内容
      openCertResult: false,
      certResult: {},
      certResultTab: 'pem',
      // 人工补申请表单
      compensateForm: {},
      compensateRules: {
        vin: [{ required: true, message: '车架号不能为空', trigger: 'blur' }],
        deviceCategory: [{ required: true, message: '设备类别不能为空', trigger: 'blur' }],
        deviceSn: [{ required: true, message: '设备SN不能为空', trigger: 'blur' }],
        certificateProfile: [{ required: true, message: '证书Profile不能为空', trigger: 'blur' }],
        csrDerBase64: [{ required: true, message: 'CSR不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '补偿原因不能为空', trigger: 'blur' }]
      },
      // 对账表单
      reconcileForm: {},
      // 安装补录表单
      confirmForm: {},
      confirmRules: {
        certSn: [{ required: true, message: '证书序列号不能为空', trigger: 'blur' }],
        deviceSn: [{ required: true, message: '设备SN不能为空', trigger: 'blur' }],
        result: [{ required: true, message: '请选择安装结果', trigger: 'change' }],
        ticketNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '补录原因不能为空', trigger: 'blur' }]
      },
      // 重新签发表单
      reissueForm: {},
      reissueRules: {
        csrDerBase64: [{ required: true, message: 'CSR不能为空', trigger: 'blur' }],
        ticketNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
        reason: [{ required: true, message: '重签原因不能为空', trigger: 'blur' }]
      }
    }
  },
  computed: {
    /** 叶子证书PEM */
    leafPem() {
      return this.derToPem(this.certResult.certificateDerBase64)
    },
    /** 证书链PEM（不含叶子） */
    chainPem() {
      const chain = this.certResult.chainDerBase64
      if (!chain || !chain.length) return ''
      return chain.map(der => this.derToPem(der)).filter(Boolean).join('\n')
    },
    /** 完整链PEM（叶子 + 证书链） */
    fullChainPem() {
      if (!this.chainPem) return ''
      return [this.leafPem, this.chainPem].filter(Boolean).join('\n')
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询证书申请记录列表 */
    getList() {
      this.loading = true
      listVehicleCertificate(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.certificateList = response.data.items
        this.total = response.data.total
        this.loading = false
      })
    },
    /** 状态显示文案 */
    statusLabel(status) {
      if (!status) return ''
      const item = this.statusOptions.find(o => o.value === status)
      return item ? item.label : status
    },
    /** 状态标签类型 */
    statusTagType(status) {
      const item = this.statusOptions.find(o => o.value === status)
      return item ? item.type : 'info'
    },
    /** 来源系统显示文案 */
    sourceLabel(source) {
      if (!source) return ''
      const item = this.sourceOptions.find(o => o.value === source)
      return item ? item.label : source
    },
    /** 操作类型显示文案 */
    actionLabel(action) {
      return this.actionTypes[action] || action
    },
    /** 是否允许安装补录（仅已签发未确认/安装失败可进入） */
    canConfirm(status) {
      return status === 'ISSUED_NOT_CONFIRMED' || status === 'INSTALL_FAILED'
    },
    /** 是否允许对账（仅申请未定案态：已请求/签发中/待对账） */
    canReconcile(status) {
      return status === 'REQUESTED' || status === 'ISSUING' || status === 'PENDING_RECONCILE'
    },
    /** 是否允许获取证书本体（仅已签发未确认/已激活，只读重取） */
    canQuery(status) {
      return status === 'ISSUED_NOT_CONFIRMED' || status === 'ACTIVE'
    },
    /** 是否允许重新签发/续期（已定案态：已签发未确认/已激活/安装失败/已过期） */
    canReissue(status) {
      return status === 'ISSUED_NOT_CONFIRMED' || status === 'ACTIVE' ||
        status === 'INSTALL_FAILED' || status === 'EXPIRED'
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 详情按钮操作 */
    handleDetail(row) {
      this.detail = {}
      this.openDetail = true
      this.loadingDetail = true
      getVehicleCertificate(row.id).then(response => {
        this.detail = response.data
        this.loadingDetail = false
      }).catch(() => {
        this.loadingDetail = false
      })
    },
    /** 人工补申请按钮操作 */
    handleCompensate() {
      this.compensateForm = {
        vin: undefined,
        deviceCategory: 'TBOX',
        deviceSn: undefined,
        certificateProfile: 'TBOX_TSP_CLIENT',
        csrDerBase64: undefined,
        requestId: undefined,
        originalMesRequestId: undefined,
        facilityNo: undefined,
        lineCode: undefined,
        ticketNo: undefined,
        reason: undefined
      }
      this.openCompensate = true
      this.$nextTick(() => {
        this.resetForm('compensateForm')
      })
    },
    /** 提交人工补申请 */
    submitCompensate() {
      this.$refs['compensateForm'].validate(valid => {
        if (!valid) return
        this.submitting = true
        compensateVehicleCertificate(this.compensateForm).then(response => {
          const data = response.data || {}
          this.$modal.msgSuccess('补申请已提交，当前状态：' + this.statusLabel(data.status || ''))
          this.openCompensate = false
          this.getList()
          this.maybeShowCert(data)
        }).finally(() => {
          this.submitting = false
        })
      })
    },
    /** 对账按钮操作 */
    handleReconcile(row) {
      this.reconcileForm = {
        id: row.id,
        vin: row.vin,
        status: row.status,
        reason: undefined
      }
      this.openReconcile = true
    },
    /** 提交对账 */
    submitReconcile() {
      this.submitting = true
      reconcileVehicleCertificate(this.reconcileForm.id, { reason: this.reconcileForm.reason }).then(response => {
        const data = response.data || {}
        this.$modal.msgSuccess('对账完成，当前状态：' + this.statusLabel(data.status || ''))
        this.openReconcile = false
        this.getList()
        this.maybeShowCert(data)
      }).finally(() => {
        this.submitting = false
      })
    },
    /** 安装补录按钮操作 */
    handleConfirmInstalled(row) {
      this.confirmForm = {
        id: row.id,
        vin: row.vin,
        certSn: row.certSn,
        deviceSn: row.deviceSn,
        result: 'SUCCESS',
        failReason: undefined,
        ticketNo: undefined,
        reason: undefined
      }
      this.openConfirm = true
      this.$nextTick(() => {
        this.resetForm('confirmForm')
      })
    },
    /** 提交安装补录 */
    submitConfirm() {
      this.$refs['confirmForm'].validate(valid => {
        if (!valid) return
        this.submitting = true
        const data = {
          certSn: this.confirmForm.certSn,
          deviceSn: this.confirmForm.deviceSn,
          result: this.confirmForm.result,
          failReason: this.confirmForm.failReason,
          ticketNo: this.confirmForm.ticketNo,
          reason: this.confirmForm.reason
        }
        confirmInstalledVehicleCertificate(this.confirmForm.id, data).then(response => {
          const result = response.data || {}
          this.$modal.msgSuccess('安装结果已补录，当前状态：' + this.statusLabel(result.status || ''))
          this.openConfirm = false
          this.getList()
        }).finally(() => {
          this.submitting = false
        })
      })
    },
    /** 重新签发按钮操作 */
    handleReissue(row) {
      this.reissueForm = {
        id: row.id,
        vin: row.vin,
        deviceSn: row.deviceSn,
        status: row.status,
        csrDerBase64: undefined,
        ticketNo: undefined,
        reason: undefined
      }
      this.openReissue = true
      this.$nextTick(() => {
        this.resetForm('reissueForm')
      })
    },
    /** 提交重新签发 */
    submitReissue() {
      this.$refs['reissueForm'].validate(valid => {
        if (!valid) return
        this.submitting = true
        const data = {
          csrDerBase64: this.reissueForm.csrDerBase64,
          ticketNo: this.reissueForm.ticketNo,
          reason: this.reissueForm.reason
        }
        reissueVehicleCertificate(this.reissueForm.id, data).then(response => {
          const result = response.data || {}
          this.$modal.msgSuccess('重新签发完成，当前状态：' + this.statusLabel(result.status || ''))
          this.openReissue = false
          this.getList()
          this.maybeShowCert(result)
        }).finally(() => {
          this.submitting = false
        })
      })
    },
    /** 获取证书本体（只读重取，展示供注入设备） */
    handleQueryCert(row) {
      this.submitting = true
      queryVehicleCertificateBody(row.id).then(response => {
        const data = response.data || {}
        if (data.certificateDerBase64) {
          this.maybeShowCert(data)
        } else {
          this.$modal.msgWarning('未获取到证书本体，可能已超出结果存储保留期')
        }
      }).finally(() => {
        this.submitting = false
      })
    },
    /** 若响应含已签发证书本体则弹窗展示，供手动注入设备 */
    maybeShowCert(data) {
      if (data && data.certificateDerBase64) {
        this.certResult = data
        this.certResultTab = 'pem'
        this.openCertResult = true
      }
    },
    /** DER Base64 转 PEM（每64字符换行） */
    derToPem(derBase64) {
      if (!derBase64) return ''
      const body = derBase64.replace(/\s/g, '').match(/.{1,64}/g)
      if (!body) return ''
      return '-----BEGIN CERTIFICATE-----\n' + body.join('\n') + '\n-----END CERTIFICATE-----'
    },
    /** 复制文本到剪贴板 */
    copyText(text) {
      if (!text) return
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$modal.msgSuccess('复制成功')
        }).catch(() => {
          this.$modal.msgError('复制失败')
        })
      } else {
        const input = document.createElement('textarea')
        input.value = text
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$modal.msgSuccess('复制成功')
      }
    },
    /** 将文本内容下载为文件 */
    downloadText(text, filename) {
      if (!text) return
      const blob = new Blob([text], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  }
}
</script>
