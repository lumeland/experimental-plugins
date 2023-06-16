interface Props {
  content: string;
  href: string;
}

export default function ({ content, href }: Props) {
  return `<a href="${href}" class="btn btn-primary">${content}</a>`;
}
