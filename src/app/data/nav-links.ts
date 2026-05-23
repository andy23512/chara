import { NavLink } from '../models/nav-link.models';
import { Page } from '../models/page.models';

export const NAV_LINKS: NavLink[] = [
  {
    page: Page.Home,
    title: 'nav.page.home.title',
    routerLink: '/',
    routerLinkActiveOptions: { exact: true },
    ariaLabel: 'nav.page.home.aria-label',
    tooltipMessage: 'nav.page.home.tooltip',
    icon: 'home',
  },
  {
    page: Page.Settings,
    title: 'nav.page.settings.title',
    routerLink: '/settings',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.settings.aria-label',
    tooltipMessage: 'nav.page.settings.tooltip',
    icon: 'settings',
  },
  {
    page: Page.Information,
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
    page: Page.Chords,
    title: 'nav.page.chords.title',
    routerLink: '/chords',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.chords.aria-label',
    tooltipMessage: 'nav.page.chords.tooltip',
    icon: 'piano',
  },
  {
    page: Page.Adaptation,
    title: 'nav.page.adaptation.title',
    routerLink: '/adaptation',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.adapt.aria-label',
    tooltipMessage: 'nav.page.adaptation.tooltip',
    lockMessage: 'nav.page.adaptation.lock-message',
    icon: 'published_with_changes',
  },
  {
    page: Page.Realization,
    title: 'Realize',
    routerLink: '/realization',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.realize.aria-label',
    tooltipMessage: 'nav.page.realize.tooltip',
    icon: 'model_training',
  },
  {
    page: Page.Accumulation,
    title: 'Accum',
    routerLink: '/accumulation',
    routerLinkActiveOptions: { exact: false },
    ariaLabel: 'nav.page.accum.aria-label',
    tooltipMessage: 'nav.page.accum.tooltip',
    icon: 'merge',
  },
];
