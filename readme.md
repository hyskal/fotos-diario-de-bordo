# Sistema de Diário de Bordo - CETEP/LNAB

Uma aplicação web moderna e minimalista desenvolvida para o Centro Territorial de Educação Profissional do Litoral Norte e Agreste Baiano (CETEP/LNAB), projetada para funcionar 100% localmente no navegador. O sistema permite que estudantes criem e baixem diários de bordo de forma simples, rápida e segura.

## 🎯 Visão Geral

O aplicativo oferece uma interface limpa e responsiva com design moderno inspirado em padrões acadêmicos contemporâneos, onde os usuários podem documentar suas atividades educacionais de forma visual e organizada.

## ✨ Funcionalidades Principais

### 📝 Gestão de Informações
- **Campos dinâmicos para estudantes**: Adicione/remova múltiplos nomes conforme necessário
- **Informações da turma**: Campo dedicado para identificação da classe
- **Interface intuitiva**: Design limpo com feedback visual em tempo real

### 📷 Gerenciamento de Fotos
- **Upload múltiplo**: Até 6 fotos por diário
- **Drag & Drop**: Interface moderna com arrastar e soltar
- **Preview em tempo real**: Visualização instantânea das fotos selecionadas
- **Compressão automática**: Otimização local com qualidade preservada
- **Formatos suportados**: JPG, PNG com validação de tipo e tamanho

### 📄 Geração de PDF Avançada
- **Layout inteligente**: Organização automática baseada na quantidade de fotos
  - ≤4 fotos: Células grandes (110mm) com espaçamento generoso
  - \>4 fotos: Células otimizadas (76.5mm) para melhor aproveitamento
- **Design profissional**: Header com logo CETEP, informações do estudante e data/hora
- **Quebra de página automática**: Logo institucional em cada nova página
- **Nome inteligente**: Arquivo nomeado como `DDMMAAAA-Turma-Estudantes.pdf`

## 🚀 Tecnologias e Arquitetura

### Frontend Moderno
- **HTML5 Semântico**: Estrutura acessível e bem organizada
- **CSS3 Avançado**: Design system com tokens, gradientes e micro-animações
- **JavaScript ES6+**: Código modular com async/await e promises
- **Design Responsivo**: Mobile-first com breakpoints otimizados

### APIs do Navegador
- **File API**: Processamento seguro de arquivos selecionados
- **Canvas API**: Redimensionamento e compressão de imagens
- **Blob API**: Geração de arquivos para download
- **URL API**: Criação de URLs temporárias para preview

### Bibliotecas Externas
- **jsPDF 2.5.1**: Geração profissional de documentos PDF
- **Design System Moderno**: Tokens de cor, tipografia Inter e componentes reutilizáveis

## 🔧 Arquitetura do Sistema

### Processamento Local Seguro
```javascript
// Exemplo do fluxo de compressão
const compressedPhoto = {
    id: Date.now() + Math.random(),
    file: blob,
    name: file.name,
    url: URL.createObjectURL(blob),
    width: compressedWidth,
    height: compressedHeight
};
```

### Geração de PDF Inteligente
- **Layout baseado no script.js original**: Mantém a lógica de organização testada
- **Células com bordas**: Visual profissional com padding consistente
- **Proporções preservadas**: Imagens centralizadas sem distorção
- **Quebra automática**: Gerenciamento inteligente de páginas

## 🎨 Design System Moderno

### Paleta de Cores Acadêmica
```css
--color-primary: #0079F2;      /* Azul institucional */
--color-academic-blue: #064097; /* Azul acadêmico escuro */
--color-success: #22c55e;       /* Verde de sucesso */
--color-surface: #f9fafb;       /* Fundo suave */
```

### Componentes Modernos
- **Cards elevados**: Sombras sutis com hover effects
- **Botões com gradientes**: Efeitos visuais sofisticados
- **Animações fluidas**: Transições suaves para melhor UX
- **Sistema de mensagens**: Feedback visual com backdrop-filter

## 📁 Estrutura do Projeto

```
diario-bordo-cetep/
├── index.html              # Interface principal com design moderno
├── style.css              # Design system completo
├── app.js                 # Lógica principal otimizada
├── assets/
│   └── logo-cetep-lnab.png # Logo institucional
└── README.md              # Esta documentação
```

## 🔒 Vantagens da Versão Local

### Privacidade e Segurança
- ✅ **Zero uploads externos**: Fotos nunca saem do dispositivo
- ✅ **Funcionamento offline**: Após carregamento inicial
- ✅ **Dados protegidos**: Informações permanecem locais
- ✅ **Sem rastreamento**: Privacidade total do usuário

### Performance Otimizada
- ⚡ **Processamento instantâneo**: Sem latência de servidor
- ⚡ **Compressão inteligente**: Algoritmos otimizados no cliente
- ⚡ **Geração rápida**: PDF criado em segundos
- ⚡ **Sem limitações**: Não há restrições de upload externo

### Usabilidade Superior
- 🎯 **Interface intuitiva**: Design limpo e moderno
- 🎯 **Feedback visual**: Estados e animações informativas
- 🎯 **Compatibilidade ampla**: Funciona em qualquer navegador moderno
- 🎯 **Responsivo**: Otimizado para desktop, tablet e mobile

## 🌐 Compatibilidade

### Navegadores Suportados
| Navegador | Versão Mínima | Status |
|-----------|---------------|---------|
| Chrome    | 60+          | ✅ Testado |
| Firefox   | 55+          | ✅ Testado |
| Safari    | 11+          | ✅ Testado |
| Edge      | 79+          | ✅ Testado |

### APIs Necessárias
- ✅ File API (suporte universal)
- ✅ Canvas API (suporte universal)
- ✅ Blob API (suporte universal)
- ✅ Download attribute (suporte universal)

## 🚀 Como Usar

1. **Abra o arquivo `index.html`** no seu navegador
2. **Preencha as informações**: Nome(s) do(s) estudante(s) e turma
3. **Adicione fotos**: Arraste e solte ou clique para selecionar (até 6 fotos)
4. **Visualize o preview**: Confirme as fotos selecionadas
5. **Gere o PDF**: Clique em "Gerar PDF" e aguarde o processamento
6. **Baixe o arquivo**: O PDF será baixado automaticamente

## 🔧 Configurações Técnicas

### Compressão de Imagens
```javascript
const CONFIG = {
    maxPhotos: 6,
    maxFileSize: 10485760, // 10MB
    imageCompression: {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8
    }
};
```

### Layout do PDF
- **Largura das células**: 85mm
- **Altura adaptativa**: 110mm (≤4 fotos) ou 76.5mm (>4 fotos)
- **Margem entre células**: 10mm ou 5mm respectivamente
- **Posicionamento**: Grade 2 colunas com centralização automática

## 📱 Responsividade

O sistema foi desenvolvido com abordagem mobile-first:

- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Interface adaptada com componentes reorganizados
- **Mobile**: Experiência otimizada com navegação simplificada

## 🎓 Sobre o CETEP/LNAB

Este sistema foi desenvolvido especificamente para atender às necessidades do Centro Territorial de Educação Profissional do Litoral Norte e Agreste Baiano, facilitando a documentação e compartilhamento das atividades acadêmicas dos estudantes.

---

**Versão**: 2.0  
**Última atualização**: Janeiro 2025  
**Desenvolvido para**: CETEP/LNAB  
**Licença**: Uso educacional