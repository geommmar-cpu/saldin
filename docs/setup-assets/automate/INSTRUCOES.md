# Saldin: Captura Inteligente (Automate)

Este guia explica como configurar a captura automática de notificações bancárias usando o Automate.

### 1. Preparação
1. Instale o app **Automate** da LlamaLab pela Play Store.
2. Baixe o arquivo `saldin_bridge.flo` (fornecido na sua conta).
3. Baixe o seu arquivo `activation_key.txt`.

### 2. Importação
1. Abra o Automate.
2. No menu principal, vá em **Import**.
3. Selecione o arquivo `saldin_bridge.flo`.

### 3. Permissões
1. Toque no fluxo importado.
2. Clique em **Privileges**.
3. Marque:
   - **Ignore battery optimizations** (Essencial para não parar de funcionar).
   - **Show notifications** (Para o Automate ver os bancos).
   - **Read files** (Para ler sua chave de ativação).

### 4. Ativação
1. Toque no ícone do Lápis para editar.
2. Verifique se o primeiro bloco (File Read) está apontando para o seu arquivo `activation_key.txt` na pasta de Downloads.
3. Volte e clique em **Start**.

---
*Dica: Certifique-se de que as notificações do seu banco estão ativadas no Android!*
