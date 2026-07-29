import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import logo from "@/assets/revenoti-logo.png";
import "./onboarding.css";

// Gerada gratuitamente em web3forms.com, entregue no e-mail guilhermengcm@gmail.com.
const WEB3FORMS_ACCESS_KEY = "bcb3afd2-9797-4dfe-baae-8b87d20ebfc7";
const LOCAL_BACKUP_KEY = "revenoti_onboarding_submissions";

type ChoiceAnswer = { selected: string; other: string };
type RestrictedAreaAnswer = { selected: string; detail: string };

type Answers = {
  servico: string;
  problema: ChoiceAnswer;
  clienteIdeal: string;
  perguntas: [string, string, string];
  diferencial: ChoiceAnswer;
  referencia: string;
  areaRestrita: RestrictedAreaAnswer;
};

const emptyAnswers: Answers = {
  servico: "",
  problema: { selected: "", other: "" },
  clienteIdeal: "",
  perguntas: ["", "", ""],
  diferencial: { selected: "", other: "" },
  referencia: "",
  areaRestrita: { selected: "", detail: "" },
};

const OTHER = "Outro";

type Question =
  | { id: "servico"; type: "textarea"; title: string; placeholder: string }
  | { id: "problema"; type: "choice"; title: string; hint?: string; options: string[] }
  | { id: "clienteIdeal"; type: "textarea"; title: string; placeholder: string }
  | { id: "perguntas"; type: "triple"; title: string }
  | { id: "diferencial"; type: "choice"; title: string; options: string[] }
  | { id: "referencia"; type: "text-optional"; title: string; placeholder: string }
  | { id: "areaRestrita"; type: "choice-detail"; title: string; options: string[]; detailPlaceholder: string };

const QUESTIONS: Question[] = [
  {
    id: "servico",
    type: "textarea",
    title: "Qual é o principal serviço que traz mais lucro para sua empresa e que você gostaria que sua marca focasse em vender mais no digital?",
    placeholder: "Ex: Consultoria de Tecnologia",
  },
  {
    id: "problema",
    type: "choice",
    title: "Se o site pudesse resolver um único problema na sua rotina hoje, qual seria?",
    hint: "Escolha a opção mais próxima ou descreva a sua.",
    options: [
      "Filtrar curiosos e atrair só quem tem perfil de compra",
      "Explicar tecnicamente o serviço sem eu precisar repetir",
      "Gerar orçamentos e propostas automaticamente",
    ],
  },
  {
    id: "clienteIdeal",
    type: "textarea",
    title: "Quem é o cliente ideal que você quer atrair com a nova divulgação?",
    placeholder: "Ex: Donos de clínicas odontológicas com 2 a 5 anos de mercado",
  },
  {
    id: "perguntas",
    type: "triple",
    title: "Quais são as 3 perguntas que os clientes sempre te fazem antes de fechar um contrato?",
  },
  {
    id: "diferencial",
    type: "choice",
    title: "Por que os clientes escolhem a sua empresa e não a concorrência?",
    options: ["Agilidade", "Confiança", "Suporte técnico", "Preço"],
  },
  {
    id: "referencia",
    type: "text-optional",
    title: "Você já tem algum site de referência (mesmo que de outro setor) que você gosta do estilo ou da forma como as informações são apresentadas?",
    placeholder: "Cole o link ou descreva o estilo — campo opcional",
  },
  {
    id: "areaRestrita",
    type: "choice-detail",
    title: "Além da apresentação da empresa, você precisará de alguma área restrita para clientes ou integração com algum sistema que você já usa?",
    options: ["Sim", "Não", "Ainda não sei"],
    detailPlaceholder: "Qual sistema ou tipo de área restrita? — opcional",
  },
];

const TOTAL = QUESTIONS.length;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isChoiceValid(answer: ChoiceAnswer) {
  if (!answer.selected) return false;
  if (answer.selected === OTHER) return answer.other.trim().length > 0;
  return true;
}

function formatChoice(answer: ChoiceAnswer) {
  return answer.selected === OTHER ? answer.other.trim() : answer.selected;
}

type Phase = "intro" | "form" | "submitting" | "done" | "error";

const OnboardingSite = () => {
  const [phase, setPhase] = useState<Phase>("intro");
  const [introExiting, setIntroExiting] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exitDelay = reduceMotion ? 300 : 2000;
    const unmountDelay = reduceMotion ? 500 : 2700;
    const t1 = setTimeout(() => setIntroExiting(true), exitDelay);
    const t2 = setTimeout(() => setPhase("form"), unmountDelay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const question = QUESTIONS[step];
  const isLast = step === TOTAL - 1;

  const currentValid = useMemo(() => {
    switch (question.id) {
      case "servico":
        return answers.servico.trim().length > 0;
      case "problema":
        return isChoiceValid(answers.problema);
      case "clienteIdeal":
        return answers.clienteIdeal.trim().length > 0;
      case "perguntas":
        return answers.perguntas[0].trim().length > 0;
      case "diferencial":
        return isChoiceValid(answers.diferencial);
      case "referencia":
        return true;
      case "areaRestrita":
        return answers.areaRestrita.selected.length > 0;
      default:
        return false;
    }
  }, [question.id, answers]);

  const goNext = () => {
    if (!currentValid) {
      setTouched(true);
      return;
    }
    setTouched(false);
    if (isLast) {
      void handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setTouched(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    setPhase("submitting");
    setSubmitError("");

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "Novo briefing de onboarding — Revenoti",
      from_name: "Formulário de Onboarding Revenoti",
      "1. Serviço mais lucrativo": answers.servico.trim(),
      "2. Problema que o site deve resolver": formatChoice(answers.problema),
      "3. Cliente ideal": answers.clienteIdeal.trim(),
      "4. Perguntas frequentes dos clientes": answers.perguntas
        .filter((p) => p.trim().length > 0)
        .map((p, i) => `${i + 1}. ${p.trim()}`)
        .join("\n"),
      "5. Diferencial competitivo": formatChoice(answers.diferencial),
      "6. Site de referência": answers.referencia.trim() || "Não informado",
      "7. Área restrita / integração": [
        answers.areaRestrita.selected,
        answers.areaRestrita.detail.trim(),
      ]
        .filter(Boolean)
        .join(" — "),
    };

    try {
      localStorage.setItem(
        LOCAL_BACKUP_KEY,
        JSON.stringify([
          ...JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || "[]"),
          { ...payload, savedAt: new Date().toISOString() },
        ])
      );
    } catch {
      // localStorage indisponível — segue apenas com o envio remoto
    }

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setPhase("done");
      } else {
        throw new Error(data.message || "Falha no envio");
      }
    } catch {
      setSubmitError("Não conseguimos enviar agora. Suas respostas ficaram salvas neste navegador — tente novamente.");
      setPhase("error");
    }
  };

  return (
    <div className="onboarding-root">
      {phase === "intro" && (
        <div className={`intro-overlay ${introExiting ? "exiting" : ""}`}>
          <div className="intro-glow" />
          <div className="intro-ring intro-ring-1" />
          <div className="intro-ring intro-ring-2" />
          <img src={logo} alt="Revenoti" className="intro-logo" />
        </div>
      )}

      {(phase === "form" || phase === "submitting" || phase === "error") && (
        <div className="onb-page">
          <header className="onb-header">
            <img src={logo} alt="Revenoti" className="onb-logo" />
            <span className="onb-step-count">
              {pad(step + 1)} / {pad(TOTAL)}
            </span>
          </header>

          <div className="onb-progress">
            <div className="onb-progress-fill" style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
          </div>

          <main className="onb-main">
            <div className="onb-question" key={step}>
              <p className="onb-kicker">Pergunta {step + 1} de {TOTAL}</p>
              <h1 className="onb-title">{question.title}</h1>
              {"hint" in question && question.hint && <p className="onb-hint">{question.hint}</p>}

              {question.type === "textarea" && (
                <textarea
                  className="onb-textarea"
                  rows={3}
                  placeholder={question.placeholder}
                  value={answers[question.id] as string}
                  onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
                  autoFocus
                />
              )}

              {question.type === "text-optional" && (
                <input
                  className="onb-text-input"
                  type="text"
                  placeholder={question.placeholder}
                  value={answers.referencia}
                  onChange={(e) => setAnswers((a) => ({ ...a, referencia: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                  autoFocus
                />
              )}

              {question.type === "triple" && (
                <div className="onb-triple">
                  {answers.perguntas.map((val, i) => (
                    <div className="onb-triple-row" key={i}>
                      <span className="onb-triple-num">{i + 1}.</span>
                      <input
                        className="onb-text-input"
                        type="text"
                        placeholder={i === 0 ? "Ex: Quanto tempo demora?" : "Opcional"}
                        value={val}
                        autoFocus={i === 0}
                        onChange={(e) =>
                          setAnswers((a) => {
                            const next = [...a.perguntas] as [string, string, string];
                            next[i] = e.target.value;
                            return { ...a, perguntas: next };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {question.type === "choice" && (
                <div className="onb-choices">
                  {[...question.options, OTHER].map((opt) => {
                    const current = answers[question.id] as ChoiceAnswer;
                    const selected = current.selected === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`onb-choice ${selected ? "selected" : ""}`}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [question.id]: { selected: opt, other: (a[question.id] as ChoiceAnswer).other } }))
                        }
                      >
                        <span className="onb-choice-dot" />
                        {opt}
                      </button>
                    );
                  })}
                  {current(answers, question.id).selected === OTHER && (
                    <input
                      className="onb-text-input onb-choice-other-input"
                      type="text"
                      placeholder="Digite sua resposta"
                      value={current(answers, question.id).other}
                      autoFocus
                      onChange={(e) =>
                        setAnswers((a) => ({
                          ...a,
                          [question.id]: { ...(a[question.id] as ChoiceAnswer), other: e.target.value },
                        }))
                      }
                    />
                  )}
                </div>
              )}

              {question.type === "choice-detail" && (
                <div className="onb-choices">
                  {question.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`onb-choice ${answers.areaRestrita.selected === opt ? "selected" : ""}`}
                      onClick={() => setAnswers((a) => ({ ...a, areaRestrita: { ...a.areaRestrita, selected: opt } }))}
                    >
                      <span className="onb-choice-dot" />
                      {opt}
                    </button>
                  ))}
                  {answers.areaRestrita.selected && answers.areaRestrita.selected !== "Não" && (
                    <input
                      className="onb-text-input onb-choice-other-input"
                      type="text"
                      placeholder={question.detailPlaceholder}
                      value={answers.areaRestrita.detail}
                      autoFocus
                      onChange={(e) => setAnswers((a) => ({ ...a, areaRestrita: { ...a.areaRestrita, detail: e.target.value } }))}
                    />
                  )}
                </div>
              )}

              {touched && !currentValid && <p className="onb-error">Preencha essa resposta para continuar.</p>}
              {phase === "error" && submitError && <p className="onb-error">{submitError}</p>}
            </div>
          </main>

          <footer className="onb-footer">
            <button className="onb-btn-ghost" onClick={goBack} disabled={step === 0}>
              Voltar
            </button>
            <button className="onb-btn-primary" onClick={goNext} disabled={phase === "submitting"}>
              {phase === "submitting" && <span className="onb-spinner" />}
              {phase === "submitting" ? "Enviando..." : isLast ? "Enviar respostas" : "Continuar"}
            </button>
          </footer>
        </div>
      )}

      {phase === "done" && (
        <div className="onb-done">
          <div className="onb-done-icon">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h1 className="onb-done-title">Recebemos seu briefing!</h1>
          <p className="onb-done-sub">
            Obrigado por responder com calma. Nosso time vai analisar tudo e volta em breve com os próximos passos do seu site.
          </p>
        </div>
      )}
    </div>
  );
};

function current(answers: Answers, id: "problema" | "diferencial"): ChoiceAnswer {
  return answers[id];
}

export default OnboardingSite;
