# 📝 Guia para Atualização de Dados

## Para o mantenedor dos dados do curso

### 🎯 Como atualizar horários e disciplinas

1. **Edite os arquivos JSON:**

   - `src/data/classes.json` - Para horários das disciplinas
   - `src/data/flowchart.json` - Para o fluxograma do curso

2. **Faça commit das mudanças:**

   ```bash
   git add src/data/
   git commit -m "feat: update [disciplina] - [descrição da mudança]"
   git push
   ```

3. **Aguarde o deploy automático:**
   - A Vercel detecta as mudanças automaticamente
   - Em 1-2 minutos a API estará atualizada
   - Verifique em: `https://que-aula-api.vercel.app/`

### 📋 Estrutura dos dados

#### Classes JSON

```json
{
  "name": "INF027",
  "description": "Introdução à Lógica",
  "semester": "1",
  "multiClass": false,
  "greve": false,
  "classes": [
    {
      "weekDay": "1", // 1=Segunda, 2=Terça, etc.
      "period": ["1", "2"], // Períodos da aula
      "teacher": "Nome do Professor",
      "classroom": "Local da aula"
    }
  ]
}
```

#### Flowchart JSON

```json
{
  "name": "INF027",
  "description": "Introdução à Lógica",
  "requiredFor": ["INF029", "INF006"], // Disciplinas que dependem desta
  "credit": "60 - 3", // Carga horária - créditos
  "state": "default", // Status no fluxograma
  "semester": 1 // Semestre da disciplina
}
```

### ⚡ Dicas importantes

- **Sempre teste localmente** antes de fazer push
- **Use commits descritivos** para facilitar o histórico
- **Mantenha backup** dos dados importantes
- **Verifique a sintaxe JSON** antes de salvar

### 🚨 Em caso de problemas

1. Verifique se o JSON está válido
2. Consulte os logs no painel da Vercel
3. Entre em contato com o desenvolvedor da API

---

**Última atualização:** $(date)
