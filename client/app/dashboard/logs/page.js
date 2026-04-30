"use client";

import { useRef, useState } from "react";
import Sidebar from "../sidebar/page";
import { ChevronDown, Eye, Layers, Rocket, ShieldCheck, Search } from "lucide-react";

export default function EnvPage() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openProjectDropdown, setOpenProjectDropdown] = useState(false);
  const [selectedProject, setSelectedProject] = useState("watch-wise");
  const projects = ["watch-wise", "sast-assignments", "core-engine"];
  const [showModal, setShowModal] = useState(false);
  const [isSensitive, setIsSensitive] = useState(true);
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState("Production and Preview");
  const envOptions = [
    { label: "Production", icon: ShieldCheck },
    { label: "Preview", icon: Eye },
    { label: "Deployment", icon: Rocket },
  ];
  const [envVars, setEnvVars] = useState([]);
  const [drafts, setDrafts] = useState([
    { key: "", value: "", note: "" },
  ]);
  const [visibleValues, setVisibleValues] = useState([false]);
  const envFileInputRef = useRef(null);

  const toggle = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const updateDraft = (index, field, value) => {
    setDrafts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addDraftRow = () => {
    setDrafts((prev) => [...prev, { key: "", value: "", note: "" }]);
    setVisibleValues((prev) => [...prev, false]);
  };

  const saveVariables = () => {
    const cleaned = drafts
      .map((item) => ({
        ...item,
        key: item.key.trim(),
        value: item.value.trim(),
        note: item.note.trim(),
      }))
      .filter((item) => item.key.length > 0);

    if (cleaned.length === 0) {
      return;
    }

    setEnvVars((prev) => [
      ...cleaned.map((item) => ({
        ...item,
        project: selectedProject,
        env: selectedEnv,
        sensitive: isSensitive,
      })),
      ...prev,
    ]);

    setDrafts([{ key: "", value: "", note: "" }]);
    setVisibleValues([false]);
    setShowModal(false);
  };

  const parseEnvText = (text) => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => {
        const equalsIndex = line.indexOf("=");
        if (equalsIndex === -1) {
          return null;
        }
        const key = line.slice(0, equalsIndex).trim();
        let value = line.slice(equalsIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return { key, value, note: "" };
      })
      .filter(Boolean);
  };

  const handleEnvFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseEnvText(text);
      if (parsed.length === 0) {
        return;
      }
      setDrafts(parsed);
      setVisibleValues(parsed.map(() => false));
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="flex bg-[#0d0e0f] text-white min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/10">
          <div className="flex justify-between items-center px-6 h-16">
            {/* LEFT */}
            <div className="relative">
              <button
                onClick={() => setOpenProjectDropdown(!openProjectDropdown)}
                className="flex items-center gap-2 cursor-pointer">
                <span className="font-mono text-xs uppercase">
                  {selectedProject}
                </span>
                <ChevronDown size={14} />
              </button>

              {openProjectDropdown && (
                <div className="absolute top-12 left-0 w-44 bg-[#111] border border-white/10 z-50">
                  {projects.map((project) => (
                    <div
                      key={project}
                      onClick={() => {
                        setSelectedProject(project);
                        setOpenProjectDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm">
                      {project}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CENTER */}
            <div className="font-mono text-xs uppercase">
              Environment Variables
            </div>

            {/* RIGHT */}
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center">
                •••
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="pt-24 pb-16 px-8 max-w-[1400px] mx-auto">
          {/* TITLE */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-2xl font-bold">Environment Variables</h1>
              <p className="text-white/40 text-sm mt-2">
                Store API keys, tokens, and config securely.
                <span className="text-white ml-2 cursor-pointer">
                  Learn more
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <button className="border border-white/10 bg-white/5 px-5 py-2 text-sm">
                Link Shared Variable
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-black px-6 py-2 text-sm clipped-btn">
                Add Environment Variable
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-8 border-b border-white/10 mb-6 text-sm uppercase">
            <div className="pb-3 border-b border-white text-white">Project</div>
            <div className="pb-3 text-white/40">Shared</div>
          </div>

          {/* FILTER BAR */}
          <div className="flex flex-wrap gap-3 mb-8">
            {/* SEARCH */}
            <div className="flex items-center bg-white/5 border border-white/10 px-3 h-11 w-[300px]">
              <Search size={14} className="text-white/40 mr-2" />
              <input
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            {/* DROPDOWNS */}
            {[
              "All Environments",
              "All Editors",
              "All Variables",
              "Last Updated",
            ].map((label) => (
              <div key={label} className="relative">
                <button
                  onClick={() => toggle(label)}
                  className="flex items-center gap-2 px-4 h-11 bg-white/5 border border-white/10 text-sm text-white/60">
                  {label}
                  <ChevronDown size={14} />
                </button>

                {openDropdown === label && (
                  <div className="absolute top-12 left-0 w-40 bg-[#111] border border-white/10 z-50">
                    <div className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm">
                      Option 1
                    </div>
                    <div className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm">
                      Option 2
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* EMPTY STATE */}
          {envVars.length === 0 ? (
            <div className="border border-white/10 bg-white/5 min-h-[350px] flex flex-col items-center justify-center text-center">
              {/* VISUAL */}
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 border border-white/20 rotate-45"></div>
                <div className="absolute inset-3 border border-white/10 -rotate-45"></div>
                <div className="absolute inset-6 bg-white/10"></div>
              </div>

              <h2 className="text-lg font-semibold mb-2">
                No Environment Variables Added
              </h2>

              <p className="text-white/40 max-w-md text-sm">
                Add Environment Variables to Production, Preview, and Development
                environments, including branches in Preview.
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="mt-6 bg-white text-black px-6 py-2 clipped-btn">
                Create Your First Variable
              </button>
            </div>
          ) : (
            <div className="border border-white/10 bg-white/5">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] uppercase text-white/40 border-b border-white/10">
                <div className="col-span-3">Key</div>
                <div className="col-span-4">Value</div>
                <div className="col-span-3">Environment</div>
                <div className="col-span-2">Project</div>
              </div>
              {envVars.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-white/5 text-sm">
                  <div className="col-span-3 font-mono">{item.key}</div>
                  <div className="col-span-4 text-white/70">
                    {item.sensitive ? "••••••••" : item.value}
                  </div>
                  <div className="col-span-3 text-white/50">{item.env}</div>
                  <div className="col-span-2 text-white/50">
                    {item.project}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {showModal && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
            <div className="w-full max-w-[520px] h-full bg-[#0b0c0d] border-l border-white/10 flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <h2 className="text-lg font-semibold">
                  Add Environment Variable
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/50 hover:text-white">
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <div className="px-6 py-6 space-y-6">
                  {drafts.map((item, index) => (
                    <div key={`draft-${index}`} className="space-y-6">
                      <div>
                        <label className="text-xs text-white/60">Key</label>
                        <input
                          value={item.key}
                          onChange={(event) =>
                            updateDraft(index, "key", event.target.value)
                          }
                          className="mt-2 w-full bg-black/50 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                          placeholder=""
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white/60">Value</label>
                        <div className="mt-2 flex items-center gap-2 bg-black/50 border border-white/10 px-4 py-3">
                          <input
                            type={visibleValues[index] ? "text" : "password"}
                            value={item.value}
                            onChange={(event) =>
                              updateDraft(index, "value", event.target.value)
                            }
                            className="w-full bg-transparent text-sm outline-none"
                            placeholder=""
                          />
                          <button
                            onClick={() =>
                              setVisibleValues((prev) =>
                                prev.map((val, i) =>
                                  i === index ? !val : val,
                                ),
                              )
                            }
                            className="text-white/40 hover:text-white">
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-white/60">
                          Note (Optional)
                        </label>
                        <input
                          value={item.note}
                          onChange={(event) =>
                            updateDraft(index, "note", event.target.value)
                          }
                          className="mt-2 w-full bg-black/50 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                          placeholder="Where to rotate, or who to contact"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="clip-wrapper bg-white/20 p-[1px] inline-flex">
                    <button
                      onClick={addDraftRow}
                      className="clip-inner bg-[#0b0c0d] px-4 py-2 text-xs">
                      + Add Another
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/10 px-6 py-6 space-y-5">
                  <div>
                    <div className="text-xs text-white/60 mb-2">
                      Environments
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
                        className="w-full flex items-center justify-between border border-white/10 bg-black/50 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-white/60" />
                          {selectedEnv}
                        </div>
                        <ChevronDown size={14} className="text-white/40" />
                      </button>

                      {envDropdownOpen && (
                        <div className="absolute top-12 left-0 w-full bg-[#111] border border-white/10 z-50">
                          {envOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <div
                                key={option.label}
                                onClick={() => {
                                  setSelectedEnv(option.label);
                                  setEnvDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm flex items-center gap-2">
                                <Icon size={14} className="text-white/60" />
                                {option.label}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/60 mb-2">Branch</div>
                    <button className="w-full border border-white/10 bg-black/50 px-4 py-3 text-sm text-left">
                      Select a Custom Preview Branch
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSensitive(!isSensitive)}
                      className={`w-10 h-6 rounded-full border border-white/10 flex items-center transition ${
                        isSensitive ? "bg-blue-500" : "bg-white/10"
                      }`}>
                      <span
                        className={`h-5 w-5 bg-white rounded-full transition ${
                          isSensitive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <div className="text-sm text-white/70">Sensitive</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="clip-wrapper bg-white/20 p-[1px] inline-flex">
                  <button
                    onClick={() => envFileInputRef.current?.click()}
                    className="clip-inner bg-[#0b0c0d] px-4 py-2 text-xs">
                    Import .env
                  </button>
                  <input
                    ref={envFileInputRef}
                    type="file"
                    accept=".env"
                    onChange={handleEnvFile}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={saveVariables}
                  className="bg-white text-black px-6 py-2 text-xs clipped-btn">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
