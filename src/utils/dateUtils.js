/**
 * Utilitários para trabalhar com datas no fuso horário local do Brasil
 */

/**
 * Obtém a data/hora atual no fuso horário de Brasília (UTC-3)
 * @returns {Date} Data atual ajustada
 */
export function getBrasiliaDate() {
  const now = new Date();
  // Converter para UTC-3 (Brasília)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const localOffset = now.getTimezoneOffset(); // offset local em minutos
  const diff = brasiliaOffset - localOffset;
  
  return new Date(now.getTime() + diff * 60 * 1000);
}

/**
 * Formata uma data no padrão brasileiro DD/MM/AAAA
 * @param {string|Date} date - Data para formatar
 * @returns {string} Data formatada
 */
export function formatDateBR(date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Adicionar um dia para compensar timezone
  d.setDate(d.getDate() + 1);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata data e hora no padrão brasileiro
 * @param {string|Date} datetime - Data/hora para formatar
 * @returns {string} Data e hora formatadas
 */
export function formatDateTimeBR(datetime) {
  if (!datetime) return '';
  
  const d = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

/**
 * Converte data DD/MM/AAAA para formato ISO (AAAA-MM-DD) para o banco
 * @param {string} dateBR - Data no formato DD/MM/AAAA
 * @returns {string} Data no formato AAAA-MM-DD
 */
export function convertBRtoISO(dateBR) {
  const [day, month, year] = dateBR.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Converte data ISO (AAAA-MM-DD) para formato brasileiro (DD/MM/AAAA)
 * @param {string} dateISO - Data no formato AAAA-MM-DD
 * @returns {string} Data no formato DD/MM/AAAA
 */
export function convertISOtoBR(dateISO) {
  const [year, month, day] = dateISO.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Obtém timestamp atual para inserir no banco (em UTC)
 * @returns {string} ISO string da data atual
 */
export function getCurrentTimestamp() {
  return getBrasiliaDate().toISOString();
}