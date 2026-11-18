import { TestBed } from '@angular/core/testing';
import { SerialPortHandlerService } from './serial-port-handler.service';

// USB ids are written out here on purpose, so the test fails if the device
// list that the app passes on changes.
const ACCEPTED = [
  { usbVendorId: 9114, usbProductId: 32783 }, // ONE M0
  { usbVendorId: 0x303a, usbProductId: 0x8252 }, // TWO S3 (pre-production)
  { usbVendorId: 0x303a, usbProductId: 0x8253 }, // TWO S3
  { usbVendorId: 0x303a, usbProductId: 0x1001 }, // M4G S3 (pre-production)
  { usbVendorId: 0x303a, usbProductId: 0x829a }, // M4G S3
];
const REJECTED = [
  { usbVendorId: 9114, usbProductId: 32796 }, // LITE M0
  { usbVendorId: 0x303a, usbProductId: 0x812e }, // LITE S2
  { usbVendorId: 0x303a, usbProductId: 0x818b }, // X
  { usbVendorId: 0x303a, usbProductId: 0x82f2 }, // T4G S2
];

const fakePort = ({
  usbVendorId,
  usbProductId,
}: {
  usbVendorId: number;
  usbProductId: number;
}) => ({ getInfo: () => ({ usbVendorId, usbProductId }) }) as SerialPort;

// The library marks these two methods private; the tests need to reach them.
const internals = (s: SerialPortHandlerService) =>
  s as unknown as {
    getSerialProvider: () => unknown;
    getViablePorts: (provider: unknown) => Promise<SerialPort[]>;
  };

describe('SerialPortHandlerService', () => {
  let service: SerialPortHandlerService;
  let provider: { requestPort: jasmine.Spy; getPorts: jasmine.Spy };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SerialPortHandlerService);
    provider = {
      requestPort: jasmine.createSpy('requestPort').and.resolveTo('the port'),
      getPorts: jasmine.createSpy('getPorts').and.resolveTo([]),
    };
    spyOn(internals(service), 'getSerialProvider').and.returnValue(
      provider as never,
    );
  });

  it('does not connect on its own', () => {
    expect(service.autoConnect).toBe(false);
  });

  it('asks the browser for a port, offering only the devices of this app', async () => {
    await service.getPort();
    expect(provider.requestPort).toHaveBeenCalledTimes(1);
    const { filters } = provider.requestPort.calls.mostRecent().args[0];
    expect(filters.length).toBe(ACCEPTED.length);
    expect(filters).toEqual(jasmine.arrayWithExactContents(ACCEPTED));
  });

  it('gives back the port the user picked', async () => {
    expect(await service.getPort()).toBe('the port' as never);
  });

  it('does not look at already allowed ports (no auto connect)', async () => {
    await service.getPort();
    expect(provider.getPorts).not.toHaveBeenCalled();
  });

  it('passes on the error when the user cancels', async () => {
    provider.requestPort.and.rejectWith(
      new DOMException('No port selected', 'NotFoundError'),
    );
    await expectAsync(service.getPort()).toBeRejectedWithError(
      'No port selected',
    );
  });

  describe("which ports count as this app's devices", () => {
    const viable = (ports: SerialPort[]) => {
      provider.getPorts.and.resolveTo(ports);
      return internals(service).getViablePorts(provider);
    };

    it('accepts every device of this app', async () => {
      const ports = ACCEPTED.map(fakePort);
      expect(await viable(ports)).toEqual(ports);
    });

    it('rejects the devices of other CharaChorder products and other USB devices', async () => {
      const ports = [...REJECTED, { usbVendorId: 1, usbProductId: 2 }].map(
        fakePort,
      );
      expect(await viable(ports)).toEqual([]);
    });

    it('needs both the vendor id and the product id to match', async () => {
      const [first] = ACCEPTED;
      const ports = [
        fakePort({ ...first, usbVendorId: first.usbVendorId + 1 }),
        fakePort({ ...first, usbProductId: first.usbProductId + 1 }),
      ];
      expect(await viable(ports)).toEqual([]);
    });
  });
});
