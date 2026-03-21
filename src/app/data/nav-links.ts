import { NavLink } from '../models/nav-link.models';

export const NAV_LINKS: NavLink[] = [
  {
    title: 'nav.page.home.title',
    routerLink: '/',
    routerLinkActiveOptions: { exact: true },
    ariaLabel: 'nav.page.home.aria-label',
    tooltipMessage: 'nav.page.home.tooltip',
    icon: 'home',
  },
  {
    title: 'nav.page.settings.title',
    routerLink: '/settings',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.settings.aria-label',
    tooltipMessage: 'nav.page.settings.tooltip',
    icon: 'settings',
  },
  {
    title: 'nav.page.information.title',
    routerLink: '/information',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.information.aria-label',
    tooltipMessage: 'nav.page.information.tooltip',
    icon: 'info',
  },
];

export const MAIN_NAV_LINKS: NavLink[] = [
  {
    title: 'Chords',
    routerLink: '/chords',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.chords.aria-label',
    tooltipMessage: 'nav.page.chords.tooltip',
    icon: 'piano',
  },
  {
    title: 'Adapt',
    routerLink: '/adapt',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.adapt.aria-label',
    tooltipMessage: 'nav.page.adapt.tooltip',
    icon: 'published_with_changes',
  },
  {
    title: 'Realize',
    routerLink: '/realize',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.realize.aria-label',
    tooltipMessage: 'nav.page.realize.tooltip',
    icon: 'model_training',
  },
  {
    title: 'Accum',
    routerLink: '/accum',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.accum.aria-label',
    tooltipMessage: 'nav.page.accum.tooltip',
    icon: 'merge',
  },
];
