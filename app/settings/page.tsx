"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import {
  SETTINGS_TABS,
  TIMEZONE_OPTIONS,
  LANGUAGE_OPTIONS,
  GENERAL_DEFAULT_VALUES,
  TRIAGE_RULE_OPTIONS,
  REPORT_TEMPLATE_OPTIONS,
  DEFAULT_AGENT_SETTINGS,
  INTEGRATIONS_DEFAULT_VALUES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_SUMMARY_FREQUENCY_OPTIONS,
  NOTIFICATIONS_DEFAULT_VALUES,
} from "@/constants/settings"
import type {
  AgentSettings,
  GeneralSettingsFormValues,
  IntegrationSettingsFormValues,
  NotificationSettingsFormValues,
  TriageAgentSettings,
  ReportAgentSettings,
} from "@/types/settings"

const generalSchema = z.object({
  companyName: z.string().min(2, "Informe o nome da empresa"),
  timezone: z.string().min(1, "Selecione um fuso horário"),
  language: z.string().min(1, "Selecione um idioma"),
  contactEmail: z.string().email("Informe um e-mail válido"),
})

const agentBaseSchema = z.object({
  id: z.enum(["triage", "reports", "escalation"]),
  name: z.string(),
  confidenceThreshold: z
    .number()
    .min(0, "Mínimo 0%")
    .max(100, "Máximo 100%"),
})

const triageAgentSchema = agentBaseSchema.extend({
  id: z.literal("triage"),
  triageRules: z.array(z.string()),
})

const reportAgentSchema = agentBaseSchema.extend({
  id: z.literal("reports"),
  template: z.enum(["daily", "weekly", "monthly", "custom"]),
})

const escalationAgentSchema = agentBaseSchema.extend({
  id: z.literal("escalation"),
})

const agentsSchema = z.object({
  agents: z.array(
    z.discriminatedUnion("id", [triageAgentSchema, reportAgentSchema, escalationAgentSchema]),
  ),
})

const emailIntegrationSchema = z.object({
  host: z.string().min(1, "Informe o host"),
  port: z.coerce.number().int().positive("Porta inválida"),
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().optional(),
  protocol: z.string().min(1, "Selecione o protocolo"),
  sslEnabled: z.boolean(),
})

const webhookIntegrationSchema = z.object({
  url: z.string().url("Informe uma URL válida"),
})

const apiKeySchema = z.object({
  id: z.string(),
  label: z.string(),
  maskedValue: z.string(),
})

const integrationsSchema = z.object({
  email: emailIntegrationSchema,
  webhook: webhookIntegrationSchema,
  apiKeys: z.array(apiKeySchema),
})

const notificationsSchema = z.object({
  notifications: z.array(
    z.object({
      id: z.enum([
        "newEscalationTicket",
        "agentOffline",
        "reportGenerated",
        "confidenceBelowThreshold",
      ]),
      enabled: z.boolean(),
    }),
  ),
  summaryFrequency: z.enum(["realtime", "hourly", "daily"]),
})

type GeneralFormSchema = z.infer<typeof generalSchema>
type AgentsFormSchema = z.infer<typeof agentsSchema>
type IntegrationsFormSchema = z.infer<typeof integrationsSchema>
type NotificationsFormSchema = z.infer<typeof notificationsSchema>

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("general")

  const generalForm = useForm<GeneralFormSchema>({
    resolver: zodResolver(generalSchema),
    defaultValues: GENERAL_DEFAULT_VALUES as GeneralSettingsFormValues,
  })

  const agentsForm = useForm<AgentsFormSchema>({
    resolver: zodResolver(agentsSchema),
    defaultValues: {
      agents: DEFAULT_AGENT_SETTINGS as AgentSettings[],
    },
  })

  const integrationsForm = useForm<IntegrationsFormSchema>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: INTEGRATIONS_DEFAULT_VALUES as IntegrationSettingsFormValues,
  })

  const notificationsForm = useForm<NotificationsFormSchema>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: NOTIFICATIONS_DEFAULT_VALUES as NotificationSettingsFormValues,
  })

  const { fields: apiKeyFields } = useFieldArray({
    control: integrationsForm.control,
    name: "apiKeys",
  })

  const [apiKeyVisibility, setApiKeyVisibility] = useState<Record<string, boolean>>({})
  const [passwordVisible, setPasswordVisible] = useState(false)

  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingAgents, setSavingAgents] = useState(false)
  const [savingIntegrations, setSavingIntegrations] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)

  const toggleApiKeyVisibility = (id: string) => {
    setApiKeyVisibility((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleSaveGeneral = async (values: GeneralFormSchema) => {
    setSavingGeneral(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Configurações gerais salvas com sucesso")
      return values
    } catch {
      toast.error("Não foi possível salvar as configurações gerais")
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleSaveAgents = async (values: AgentsFormSchema) => {
    setSavingAgents(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Configurações dos agentes salvas com sucesso")
      return values
    } catch {
      toast.error("Não foi possível salvar as configurações dos agentes")
    } finally {
      setSavingAgents(false)
    }
  }

  const handleSaveIntegrations = async (values: IntegrationsFormSchema) => {
    setSavingIntegrations(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Integrações salvas com sucesso")
      return values
    } catch {
      toast.error("Não foi possível salvar as integrações")
    } finally {
      setSavingIntegrations(false)
    }
  }

  const handleSaveNotifications = async (values: NotificationsFormSchema) => {
    setSavingNotifications(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Preferências de notificações salvas com sucesso")
      return values
    } catch {
      toast.error("Não foi possível salvar as preferências de notificações")
    } finally {
      setSavingNotifications(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie parâmetros globais da plataforma, agentes de IA, integrações e notificações.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full max-w-xl">
                {SETTINGS_TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="general">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>
                      Defina informações básicas da organização e preferências padrão.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...generalForm}>
                      <form
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        onSubmit={generalForm.handleSubmit(handleSaveGeneral)}
                      >
                        <FormField
                          control={generalForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Nome da empresa</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da empresa" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fuso horário</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o fuso horário" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMEZONE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Idioma</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o idioma" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LANGUAGE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>E-mail de contato</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contato@empresa.com.br" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="md:col-span-2 flex justify-end">
                          <Button type="submit" disabled={savingGeneral}>
                            {savingGeneral ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agents">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {agentsForm.watch("agents").map((agent, index) => {
                    const isTriageAgent = agent.id === "triage"
                    const isReportAgent = agent.id === "reports"
                    const title =
                      agent.id === "triage"
                        ? "Triagem de E-mails"
                        : agent.id === "reports"
                        ? "Gerador de Relatórios"
                        : "Escalonamento"

                    const description =
                      agent.id === "triage"
                        ? "Ajuste as regras de triagem automática de e-mails."
                        : agent.id === "reports"
                        ? "Configure os templates padrão de relatórios."
                        : "Defina a sensibilidade das regras de escalonamento."

                    return (
                      <Card key={agent.id} className="bg-card border-border flex flex-col">
                        <CardHeader>
                          <CardTitle>{title}</CardTitle>
                          <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-1">
                          <Form {...agentsForm}>
                            <div className="space-y-4">
                              <FormField
                                control={agentsForm.control}
                                name={`agents.${index}.confidenceThreshold`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Threshold de confiança (%)</FormLabel>
                                    <div className="flex items-center gap-4">
                                      <FormControl>
                                        <Slider
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={[field.value]}
                                          onValueChange={(value) => field.onChange(value[0])}
                                        />
                                      </FormControl>
                                      <span className="w-12 text-right text-sm text-muted-foreground">
                                        {field.value}%
                                      </span>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {isTriageAgent && (
                                <FormField
                                  control={agentsForm.control}
                                  name={`agents.${index}.triageRules` as `agents.${number}.triageRules`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Regras de triagem</FormLabel>
                                      <div className="space-y-2">
                                        {TRIAGE_RULE_OPTIONS.map((rule) => {
                                          const checked = field.value?.includes(rule.value)
                                          return (
                                            <label
                                              key={rule.value}
                                              className="flex items-start gap-2 text-sm"
                                            >
                                              <Checkbox
                                                checked={checked}
                                                onCheckedChange={(checkedValue) => {
                                                  if (checkedValue) {
                                                    field.onChange([...(field.value ?? []), rule.value])
                                                  } else {
                                                    field.onChange(
                                                      (field.value ?? []).filter((value) => value !== rule.value),
                                                    )
                                                  }
                                                }}
                                              />
                                              <span className="text-sm text-foreground">{rule.label}</span>
                                            </label>
                                          )
                                        })}
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              {isReportAgent && (
                                <FormField
                                  control={agentsForm.control}
                                  name={`agents.${index}.template` as `agents.${number}.template`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Template de relatório</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione o template" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {REPORT_TEMPLATE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          </Form>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={savingAgents}
                            onClick={agentsForm.handleSubmit(handleSaveAgents)}
                          >
                            {savingAgents ? "Salvando..." : "Salvar"}
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="integrations">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Integrações</CardTitle>
                    <CardDescription>
                      Configure conexões de e-mail, webhooks e chaves de API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <Form {...integrationsForm}>
                      <form
                        className="space-y-8"
                        onSubmit={integrationsForm.handleSubmit(handleSaveIntegrations)}
                      >
                        <section className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-foreground">E-mail (SMTP/IMAP)</h3>
                            <p className="text-xs text-muted-foreground">
                              Configure o servidor de e-mail utilizado para ingestão e disparo de alertas.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={integrationsForm.control}
                              name="email.host"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Host</FormLabel>
                                  <FormControl>
                                    <Input placeholder="smtp.seudominio.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={integrationsForm.control}
                              name="email.port"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Porta</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      {...field}
                                      onChange={(event) => field.onChange(event.target.value)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={integrationsForm.control}
                              name="email.username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Usuário</FormLabel>
                                  <FormControl>
                                    <Input placeholder="alerts@seudominio.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={integrationsForm.control}
                              name="email.password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Senha</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type={passwordVisible ? "text" : "password"}
                                        {...field}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPasswordVisible((value) => !value)}
                                      >
                                        {passwordVisible ? "Ocultar" : "Mostrar"}
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={integrationsForm.control}
                              name="email.protocol"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Protocolo</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o protocolo" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="IMAP">IMAP</SelectItem>
                                      <SelectItem value="POP3">POP3</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={integrationsForm.control}
                              name="email.sslEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-col justify-end">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="space-y-1">
                                      <FormLabel>SSL/TLS</FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                        Ative para conexões seguras.
                                      </p>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </section>

                        <section className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-foreground">Webhooks</h3>
                            <p className="text-xs text-muted-foreground">
                              Receba eventos em tempo real em sistemas externos.
                            </p>
                          </div>
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 max-w-xl">
                            <FormField
                              control={integrationsForm.control}
                              name="webhook.url"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>URL do Webhook</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://api.seusistema.com/webhooks/logiagent" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const webhookUrl = integrationsForm.getValues("webhook.url")
                                  if (!webhookUrl) {
                                    toast.error("Informe uma URL de webhook antes de testar")
                                    return
                                  }
                                  toast.info("Enviando evento de teste para o webhook configurado")
                                }}
                              >
                                Testar Webhook
                              </Button>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-foreground">API Keys</h3>
                            <p className="text-xs text-muted-foreground">
                              Gerencie as chaves utilizadas para integrar a plataforma com outros sistemas.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {apiKeyFields.map((fieldItem, index) => {
                              const keyId = fieldItem.id
                              const currentValue = integrationsForm.watch(`apiKeys.${index}.maskedValue`)
                              const visible = apiKeyVisibility[keyId]

                              return (
                                <div
                                  key={keyId}
                                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-md border border-border bg-muted/20 px-4 py-3"
                                >
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">
                                      {integrationsForm.watch(`apiKeys.${index}.label`)}
                                    </Label>
                                    <p className="font-mono text-xs text-muted-foreground break-all">
                                      {visible ? currentValue : currentValue}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleApiKeyVisibility(keyId)}
                                    >
                                      {visible ? "Ocultar" : "Revelar"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        toast.success("Nova API key gerada (mock). Atualize via backend real.")
                                      }}
                                    >
                                      Regenerar
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </section>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={savingIntegrations}>
                            {savingIntegrations ? "Salvando..." : "Salvar Integrações"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Notificações</CardTitle>
                    <CardDescription>
                      Controle quais eventos geram alertas e com que frequência receber resumos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationsForm}>
                      <form
                        className="space-y-8"
                        onSubmit={notificationsForm.handleSubmit(handleSaveNotifications)}
                      >
                        <section className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-foreground">Tipos de notificação</h3>
                            <p className="text-xs text-muted-foreground">
                              Ative ou desative notificações específicas geradas pelos agentes.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {notificationsForm.watch("notifications").map((notification, index) => (
                              <FormField
                                key={notification.id}
                                control={notificationsForm.control}
                                name={`notifications.${index}.enabled`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-sm font-medium">
                                        {NOTIFICATION_TYPE_LABELS[notification.id]}
                                      </FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </section>

                        <section className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-foreground">Resumo de notificações</h3>
                            <p className="text-xs text-muted-foreground">
                              Defina a frequência dos resumos consolidados enviados por e-mail.
                            </p>
                          </div>
                          <FormField
                            control={notificationsForm.control}
                            name="summaryFrequency"
                            render={({ field }) => (
                              <FormItem className="max-w-sm">
                                <FormLabel>Frequência</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a frequência" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {NOTIFICATION_SUMMARY_FREQUENCY_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </section>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={savingNotifications}>
                            {savingNotifications ? "Salvando..." : "Salvar Preferências"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

