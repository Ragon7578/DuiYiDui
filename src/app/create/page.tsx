"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

export default function CreateContractPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
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
    setParties([])
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">创建契约</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">契约标题</label>
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
    </div>
  )
}
