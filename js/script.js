const formulario = document.getElementById("formulario");
const cidade = document.getElementById("cidade");
const botaoBuscar = document.getElementById("botao-buscar");
const mensagem = document.getElementById("mensagem");
const listaCidades = document.getElementById("lista-cidades");
const climaAtual = document.getElementById("clima-atual");
const previsao = document.getElementById("previsao");
const botaoFavorito = document.getElementById("botao-favorito");
const listaFavoritos = document.getElementById("lista-favoritos");

let cidadeSelecionada = null;

let favoritos = carregarFavoritos();

const descricoesClima = {
    0: 'Céu limpo',
    1: 'Predominantemente limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Nevoeiro',
    48: 'Nevoeiro',
    51: 'Garoa leve',
    53: 'Garoa moderada',
    55: 'Garoa intensa',
    56: 'Garoa congelante leve',
    56: 'Garoa congelante intensa',
    61: 'Chuva fraca',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    66: 'Chuva congelante leve',
    67: 'Chuva congelante forte',
    71: 'Neve fraca',
    73: 'Neve moderada',
    75: 'Neve forte',
    77: 'Grãos de neve',
    80: 'Pancadas de chuva fracas',
    81: 'Pancadas de chuva moderadas',
    82: 'Pancadas de chuva violentas',
    85: 'Pancadas de neve fracas',
    86: 'Pancadas de neve fortes',
    95: 'Tempestade',
    96: 'Tempestade com granizo leve',
    99: 'Tempestade com granizo forte'
};

formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const termo = cidade.value;
    if (termo === '') {
        mensagem.textContent = 'digite o nome de uma cidade';
        return;
    }
})

cidadeSelecionada = null;
listaCidades.textContent = '';
climaAtual = textContent = 'Selecione uma cidade para consultar o clima';
previsao.textContent = 'A previsão aparecerá após pesquisar uma cidade';
botaoFavorito.hidden = true;

pesquisarCidades(termo);

async function pesquisarCidades(termo) {

    mensagem.textContent = 'Buscando cidades...';
    botaoBuscar.disabled = true;

    try {

        const parametros = new URLSearchParams({
            name: termo,
            count: 10,
            language: 'pt',
            format: 'json'
        });

        const resposta = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?${parametros}`
        );

        if (!resposta.ok) {
            throw new Error('Erro ao buscar cidades.');
        }

        const dados = await resposta.json();
        const locais = dados.results || [];

        if (locais.length === 0) {
            mensagem.textContent = 'Nenhuma cidade encontrada.';
            return;
        }

        mensagem.textContent = `${locais.length} cidades encontradas.`;

        mostrarCidades(locais);

    } catch (erro) {

        mensagem.textContent = 'Não foi possível buscar as cidades.';
        console.error(erro);

    } finally {

        botaoBuscar.disabled = false;

    }

}


//MOSTRAR CIDADES ENCONTRADAS

function mostrarCidades(locais) {

    listaCidades.textContent = '';

    for (let i =0;i<locais.length;i++){
        const local = locais[i];

        const item = document.createElement('li');
        const botao = document.createElement('button');

        let nomeCompleto= local.name;

        if(local.admin1){
            nomeCompleto+=',' + local.admin1;
        }
        if(local.country){
            nomeCompleto+=',' + local.coutry;
        }
        botao.textContent=nomeCompleto;
        botao.addEventListener('click', function(){
            consultarClima(local);

        });
        item.appendChild(botao);
        listaCidades.appendChild(item);
    }
}


//CONSULTAR CLIMA

async function consultarClima(local) {

    cidadeSelecionada = local;

    listaCidades.textContent = '';
    mensagem.textContent = 'Carregando informações meteorológicas...';

    climaAtual.textContent = '';
    previsao.textContent = '';
    botaoFavorito.hidden = true;

    try {

        const parametros = new URLSearchParams({
            latitude: local.latitude,
            longitude: local.longitude,

            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',

            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',

            forecast_days: 5,
            timezone: 'auto'
        });

        const resposta = await fetch(
            `https://api.open-meteo.com/v1/forecast?${parametros}`
        );

        if (!resposta.ok) {
            throw new Error('Erro ao consultar o clima.');
        }

        const dados = await resposta.json();

        mostrarClima(local, dados);
        mostrarPrevisao(dados);

        mensagem.textContent = 'Consulta realizada com sucesso!';

        botaoFavorito.hidden = false;
        atualizarBotaoFavorito();

    } catch (erro) {

        climaAtual.textContent = 'Não foi possível consultar o clima.';
        previsao.textContent = '';
        mensagem.textContent = 'Ocorreu um erro na consulta meteorológica.';

        console.error(erro);

    }

}


//mostrar CONDIÇÕES METEOROLÓGICAS

function mostrarClima(local, dados) {

    const atual = dados.current;
    const unidades = dados.current_units;

    const descricao = descricoesClima[atual.weather_code] || 'Descrição não disponível';

    let nomeLocal = local.name;
    if(local.admin1){
        nomeLocal+=',' + local.admin1;
    }
    if(local.country){
        nomeLocal+=',',+ local.country;
    }

    climaAtual.textContent = '';

    const titulo = document.createElement('h3');
    titulo.textContent = nomeLocal;

    const condicao = document.createElement('p');
    condicao.textContent = descricao;

    const temperatura = document.createElement('p');
    temperatura.textContent =
        `Temperatura: ${atual.temperature_2m ?? 'Indisponível'} ${unidades.temperature_2m}`;

    const sensacao = document.createElement('p');
    sensacao.textContent =
        `Sensação térmica: ${atual.apparent_temperature ?? 'Indisponível'} ${unidades.apparent_temperature}`;

    const umidade = document.createElement('p');
    umidade.textContent =
        `Umidade: ${atual.relative_humidity_2m ?? 'Indisponível'} ${unidades.relative_humidity_2m}`;

    const vento = document.createElement('p');
    vento.textContent =
        `Velocidade do vento: ${atual.wind_speed_10m ?? 'Indisponível'} ${unidades.wind_speed_10m}`;

    climaAtual.append(
        titulo,
        condicao,
        temperatura,
        sensacao,
        umidade,
        vento
    );

}


//MOSTRAR A PREVISÃO proximos 5 dias

function mostrarPrevisao(dados) {

    const dias = dados.daily;
    const unidades = dados.daily_units;

    previsao.textContent = '';

    for (let i = 0; i < dias.time.length; i++) {

        const cartao = document.createElement('div');

        cartao.classList.add('cartao-previsao');

        const data = document.createElement('h3');

        const dataFormatada = new Date(dias.time[i] + 'T12:00:00');

        data.textContent = dataFormatada.toLocaleDateString('pt-BR');

        const condicao = document.createElement('p');

        condicao.textContent =
            descricoesClima[dias.weather_code[i]] || 'Descrição não disponível';

        const minima = document.createElement('p');

        minima.textContent =
            `Mínima: ${dias.temperature_2m_min[i]} ${unidades.temperature_2m_min}`;

        const maxima = document.createElement('p');

        maxima.textContent =
            `Máxima: ${dias.temperature_2m_max[i]} ${unidades.temperature_2m_max}`;

        const chuva = document.createElement('p');

        const probabilidade = dias.precipitation_probability_max[i];

        chuva.textContent = probabilidade === null
            ? 'Probabilidade de chuva: Indisponível'
            : `Probabilidade de chuva: ${probabilidade}%`;

        cartao.append(
            data,
            condicao,
            minima,
            maxima,
            chuva
        );

        previsao.appendChild(cartao);

    }

}


//CARREGAR FAVORITOS do localstorage

function carregarFavoritos() {

    try {
        const dadosSalvos = localStorage.getItem('favoritos');
        if(dadosSalvos){
            return JSON.parse(dadosSalvos);

        }else{
            return[];
        }
    }catch(erro){
        console.error('erro ao carregar favoritos', erro);
        return[];
    }

}


//SALVAR FAVORITOS no localstorage

function salvarFavoritos() {

    localStorage.setItem('favoritos', JSON.stringify(favoritos));

}


//ADICIONAR CIDADE aos favoritos

botaoFavorito.addEventListener('click', function () {

    if (!cidadeSelecionada) {
        return;
    }

    let jaExiste = false;

    for (let i = 0;i< favoritos.length; i++){
        if(favoritos[i].id === cidadeSelecionada.id){
            jaExiste=true;
        }
    }
    if (jaExiste) {

        mensagem.textContent = 'Essa cidade já está nos favoritos.';
        return;

    }

    const favorito = {
        id: cidadeSelecionada.id,
        name: cidadeSelecionada.name,
        admin1: cidadeSelecionada.admin1,
        country: cidadeSelecionada.country,
        latitude: cidadeSelecionada.latitude,
        longitude: cidadeSelecionada.longitude
    };

    favoritos.push(favorito);

    salvarFavoritos();
    mostrarFavoritos();
    atualizarBotaoFavorito();

    mensagem.textContent = 'Cidade adicionada aos favoritos!';

});


//ATUALIZAR LISTA DE FAVORITOS
------------------------------------------------
function mostrarFavoritos() {

    listaFavoritos.textContent = '';

    if (favoritos.length === 0) {

        const item = document.createElement('li');
        item.textContent = 'Nenhuma cidade favorita cadastrada.';

        listaFavoritos.appendChild(item);

        return;

    }

    favoritos.forEach(function (favorito, indice) {

        const item = document.createElement('li');

        const nome = document.createElement('span');

        nome.textContent = [
            favorito.name,
            favorito.country
        ].filter(Boolean).join(', ');

        const botaoConsultar = document.createElement('button');

        botaoConsultar.textContent = 'Consultar';

        botaoConsultar.addEventListener('click', function () {
            consultarClima(favorito);
        });

        const botaoRemover = document.createElement('button');

        botaoRemover.textContent = 'Remover';

        botaoRemover.addEventListener('click', function () {

            removerFavorito(indice);

        });

        item.append(
            nome,
            botaoConsultar,
            botaoRemover
        );

        listaFavoritos.appendChild(item);

    });

}


//REMOVER favorito

function removerFavorito(indice) {

    favoritos.splice(indice, 1);

    salvarFavoritos();
    mostrarFavoritos();
    atualizarBotaoFavorito();

}


//atualizar BOTÃO de fav

function atualizarBotaoFavorito() {

    if (!cidadeSelecionada) {
        botaoFavorito.hidden = true;
        return;
    }

    const jaExiste = favoritos.some(function (favorito) {

        return favorito.id === cidadeSelecionada.id;

    });

    botaoFavorito.textContent = jaExiste
        ? 'Cidade já está nos favoritos'
        : 'Adicionar aos favoritos';

    botaoFavorito.disabled = jaExiste;

}


mostrarFavoritos();
