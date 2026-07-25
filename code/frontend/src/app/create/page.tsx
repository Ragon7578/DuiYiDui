"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

type CreateMode = "goal" | "contract"

export default function CreatePage() {
  const [mode, setMode] = useState<CreateMode>("goal")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">创建</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("goal")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "goal" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          创建目标
        </button>
        <button
          onClick={() => setMode("contract")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "contract" ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          创建契约
        </button>
      </div>

      {mode === "goal" ? <GoalForm /> : <ContractForm />}
    </div>
  )
}

function GoalForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [reward, setReward] = useState("")
  const [deadline, setDeadline] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    alert(`目标创建成功！\n\n记住：达成 "${title}" 后，奖励自己 "${reward}"`)
    setTitle("")
    setDescription("")
    setReward("")
    setDeadline("")
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">目标标题 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：连续跑步 30 天"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="具体要做些什么？"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">奖励 *</label>
          <input
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="达成后你想奖励自己什么？例如：买一双跑鞋"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            required
          />
          <p className="mt-1 text-xs text-gray-400">想清楚奖励，才有动力兑现承诺</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">截止日期</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          创建目标
        </button>
      </form>
    </Card>
  )
}

function ContractForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [reward, setReward] = useState("")
  const [partyName, setPartyName] = useState("")
  const [parties, setParties] = useState<string[]>([])

  function addParty() {
    if (partyName.trim() && !parties.includes(partyName.trim())) {
      setParties([...parties, partyName.trim()])
      setPartyName("")
    }
  }

  function removeParty(name: string) {
    setParties(parties.filter((p) => p !== name))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    alert("契约创建成功！（演示版）")
    setTitle("")
    setDescription("")
    setReward("")
    setParties([])
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">契约标题 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：合作协议"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="契约的具体内容与目的..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">约定奖励</label>
          <input
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="完成后双方如何庆祝？"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">参与方</label>
          <div className="flex gap-2">
            <input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="输入对方名称"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addParty())}
            />
            <button
              type="button"
              onClick={addParty}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-50"
            >
              添加
            </button>
          </div>
          {parties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {parties.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => removeParty(p)}
                    className="text-gray-400 hover:text-black"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          创建契约
        </button>
      </form>
    </Card>
  )
}
