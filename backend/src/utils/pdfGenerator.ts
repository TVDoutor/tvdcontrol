import PDFDocument from 'pdfkit';

function formatCpf(v: string | null | undefined): string {
  if (!v || !v.trim()) return '–';
  const d = String(v).replace(/\D/g, '');
  if (d.length !== 11) return v;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatCnpj(v: string | null | undefined): string {
  if (!v || !v.trim()) return '–';
  const d = String(v).replace(/\D/g, '');
  if (d.length !== 14) return v;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export type CompanyData = {
  name: string;
  legalName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  cnpj?: string | null;
};

export type UserData = {
  name: string;
  department: string;
  cpf?: string | null;
};

export type ItemData = {
  category: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  assetTag?: string | null;
  notes?: string | null;
};

export type RecebimentoData = {
  company: CompanyData;
  user: UserData;
  item: ItemData;
  date: string;
  signatureBase64?: string | null;
};

export type DevolucaoData = {
  company: CompanyData;
  user: UserData;
  item: ItemData;
  date: string;
  returnItems?: string[] | null;
  returnNotes?: string | null;
  signatureBase64?: string | null;
};

export type TermoItensUsuarioData = {
  company: CompanyData;
  user: UserData;
  items: ItemData[];
  date: string;
};

function buildCompanyLine(company: CompanyData): string {
  const parts: string[] = [];
  if (company.legalName) parts.push(company.legalName);
  else if (company.name) parts.push(company.name);
  if (company.address) parts.push(`com sede à ${company.address}`);
  const cityState = [company.city, company.state].filter(Boolean).join('/');
  if (cityState) parts.push(cityState + '.');
  if (company.cnpj) parts.push(`inscrita no CNPJ sob nº ${formatCnpj(company.cnpj)}`);
  return parts.join(', ');
}

export function generateRecebimentoPdf(data: RecebimentoData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const companyLine = buildCompanyLine(data.company);
    doc.fontSize(11).text(companyLine, { align: 'justify' });
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('TERMO DE RESPONSABILIDADE PELO USO DE EQUIPAMENTO CORPORATIVO', { align: 'center' });
    doc.font('Helvetica').fontSize(11);
    doc.moveDown(1);

    const userCpf = data.user.cpf ? formatCpf(data.user.cpf) : '–';
    doc.text(
      `A empresa ${data.company.name || 'acima indicada'}, entrega neste ato à colaborador(a) ${data.user.name}, ` +
      `ocupante do cargo de ${data.user.department}, portador(a) do CPF nº ${userCpf}, doravante denominado(a) simplesmente USUÁRIO(A), o seguinte equipamento corporativo:`,
      { align: 'justify' }
    );
    doc.moveDown(1);

    doc.text(`• Equipamento: ${data.item.category}`);
    doc.text(`• Marca: ${data.item.manufacturer || '–'}`);
    doc.text(`• Modelo: ${data.item.model}`);
    doc.text(`• Número de patrimônio / série: ${data.item.assetTag || data.item.serialNumber}`);
    if (data.item.notes) doc.text(`• Observações: ${data.item.notes}`);
    doc.moveDown(1);

    doc.text(
      'O referido equipamento é cedido à USUÁRIO(A) mediante as condições abaixo descritas:',
      { align: 'justify' }
    );
    doc.moveDown(0.5);

    const clauses = [
      '1. O equipamento deverá ser utilizado única e exclusivamente para fins profissionais, no exercício das atividades relacionadas à função desempenhada pelo(a) USUÁRIO(A), sendo vedada sua utilização para fins pessoais ou estranhos aos interesses da empresa.',
      '2. O(A) USUÁRIO(A) é totalmente responsável pela guarda, uso adequado, conservação e zelo do equipamento, comprometendo-se a utilizá-lo conforme as orientações da empresa e a comunicar imediatamente qualquer dano, defeito, perda, furto ou extravio.',
      '3. O(A) USUÁRIO(A) possui apenas a posse direta (detenção) do equipamento, não adquirindo, em hipótese alguma, direito de propriedade sobre o bem, sendo expressamente proibidos o empréstimo, a cessão, a locação ou a entrega do equipamento a terceiros, sob qualquer título.',
      '4. É vedada a instalação de programas, softwares ou aplicativos não autorizados pela empresa, bem como qualquer alteração de configuração que possa comprometer a segurança, o desempenho ou a integridade do equipamento e das informações corporativas.',
      '5. Em caso de término da prestação de serviços ou rescisão do contrato de trabalho, por qualquer motivo, o(a) USUÁRIO(A) compromete-se a devolver o equipamento no mesmo dia do desligamento, em perfeito estado de funcionamento, ressalvado apenas o desgaste natural decorrente do uso normal.',
      '6. O descumprimento das disposições deste termo poderá ensejar a responsabilização do(a) USUÁRIO(A) por eventuais danos, sem prejuízo das demais medidas administrativas e legais cabíveis, nos termos da legislação vigente.',
    ];
    clauses.forEach((c) => {
      doc.text(c, { align: 'justify' });
      doc.moveDown(0.4);
    });

    doc.text('E, por estarem de pleno acordo, as partes assinam o presente termo.', { align: 'justify' });
    doc.moveDown(2);
    doc.text(`${data.company.city || 'Cidade'}, ${data.date}`);
    doc.moveDown(1.5);
    doc.text('__________________________________________');
    doc.text(data.company.name || 'Empresa');
    doc.moveDown(1);
    if (data.signatureBase64 && data.signatureBase64.startsWith('data:image')) {
      try {
        const base64Data = data.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
        const imgBuf = Buffer.from(base64Data, 'base64');
        doc.image(imgBuf, 50, doc.y, { width: 120, height: 50 });
        doc.moveDown(0.5);
      } catch {
        doc.text('__________________________________________');
      }
    } else {
      doc.text('__________________________________________');
    }
    doc.text(data.user.name);

    doc.end();
  });
}

export function generateDevolucaoPdf(data: DevolucaoData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(12).font('Helvetica-Bold').text('TERMO DE DEVOLUÇÃO DE EQUIPAMENTO CORPORATIVO', { align: 'center' });
    doc.font('Helvetica').fontSize(11);
    doc.moveDown(1);

    doc.text(
      `O(A) colaborador(a) ${data.user.name}, ocupante do cargo de ${data.user.department}, ` +
      `devolve à empresa ${data.company.name || 'acima indicada'} o seguinte equipamento:`,
      { align: 'justify' }
    );
    doc.moveDown(1);

    doc.text(`• Equipamento: ${data.item.category}`);
    doc.text(`• Marca: ${data.item.manufacturer || '–'}`);
    doc.text(`• Modelo: ${data.item.model}`);
    doc.text(`• Número de patrimônio / série: ${data.item.assetTag || data.item.serialNumber}`);
    doc.moveDown(1);

    if (data.returnItems && data.returnItems.length > 0) {
      doc.text('Itens devolvidos:');
      data.returnItems.forEach((r) => doc.text(`  - ${r}`));
      doc.moveDown(1);
    }
    if (data.returnNotes) {
      doc.text(`Observações: ${data.returnNotes}`);
      doc.moveDown(1);
    }

    doc.text(`Data da devolução: ${data.date}`);
    doc.moveDown(1.5);
    doc.text('__________________________________________');
    doc.text(data.company.name || 'Empresa');
    doc.moveDown(1);
    if (data.signatureBase64 && data.signatureBase64.startsWith('data:image')) {
      try {
        const base64Data = data.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
        const imgBuf = Buffer.from(base64Data, 'base64');
        doc.image(imgBuf, 50, doc.y, { width: 120, height: 50 });
        doc.moveDown(0.5);
      } catch {
        doc.text('__________________________________________');
      }
    } else {
      doc.text('__________________________________________');
    }
    doc.text(data.user.name);

    doc.end();
  });
}

export function generateTermoItensUsuarioPdf(data: TermoItensUsuarioData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const companyLine = buildCompanyLine(data.company);
    doc.fontSize(11).text(companyLine, { align: 'justify' });
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text(
      'TERMO DE RESPONSABILIDADE — RELAÇÃO DE EQUIPAMENTOS CORPORATIVOS',
      { align: 'center' }
    );
    doc.font('Helvetica').fontSize(11);
    doc.moveDown(1);

    const userCpf = data.user.cpf ? formatCpf(data.user.cpf) : '–';
    doc.text(
      `A empresa ${data.company.name || 'acima indicada'}, declara que o(a) colaborador(a) ${data.user.name}, ` +
      `ocupante do cargo de ${data.user.department}, portador(a) do CPF nº ${userCpf}, possui sob sua responsabilidade os seguintes equipamentos corporativos:`,
      { align: 'justify' }
    );
    doc.moveDown(1);

    data.items.forEach((item, i) => {
      doc.font('Helvetica-Bold').text(`${i + 1}. ${item.category} — ${item.model}`, { continued: false });
      doc.font('Helvetica').fontSize(10);
      doc.text(`   Marca: ${item.manufacturer || '–'} | Nº patrimônio/série: ${item.assetTag || item.serialNumber}`);
      if (item.notes) doc.text(`   Observações: ${item.notes}`);
      doc.fontSize(11).moveDown(0.5);
    });

    doc.moveDown(0.5);
    doc.text(
      'O(A) colaborador(a) assume total responsabilidade pelo uso adequado, conservação e devolução dos equipamentos acima, em conformidade com as políticas da empresa.',
      { align: 'justify' }
    );
    doc.moveDown(2);
    doc.text(`${data.company.city || 'Cidade'}, ${data.date}`);
    doc.moveDown(1.5);
    doc.text('__________________________________________');
    doc.text(data.company.name || 'Empresa');
    doc.moveDown(0.5);
    doc.text(data.user.name);

    doc.end();
  });
}
